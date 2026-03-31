import { pathManager } from '@aws-amplify/amplify-cli-core';
import {
  CloudFormationClient,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  DescribeChangeSetCommandOutput,
  DeleteChangeSetCommand,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  paginateListChangeSets,
  type ResourceChange,
} from '@aws-sdk/client-cloudformation';
import Bottleneck from 'bottleneck';
import fs from 'fs-extra';
import * as path from 'path';
import { globSync } from 'glob';
import type { Printer } from '@aws-amplify/amplify-prompts';

export interface ResourceChangeWithNested extends ResourceChange {
  nestedChanges?: ResourceChangeWithNested[];
}

export interface TemplateDriftResults {
  changes: ResourceChangeWithNested[];
  skipped: boolean;
  skipReason?: string;
  skippedStacks?: string[];
}

const CHANGESET_PREFIX = 'amplify-drift-detection-';

const S3_TEMPLATE_PATH_PREFIX = 'amplify-cfn-templates/';

interface NestedTemplateInfo {
  templateBody: string;
  category: string;
}

interface NestedTemplateResolution {
  resolved: Map<string, NestedTemplateInfo>;
  skipped: string[];
}

/**
 * Resolve cached templates for nested stacks by matching TemplateURL filenames
 * from the root template against files in the local build directory.
 *
 * Pure function — no API calls, no logging.
 */
function resolveNestedTemplates(
  rootTemplate: Record<string, any>,
  buildDir: string,
): NestedTemplateResolution {
  const resolved = new Map<string, NestedTemplateInfo>();
  const skipped: string[] = [];

  for (const [logicalId, resource] of Object.entries(rootTemplate.Resources || {})) {
    const res = resource as Record<string, any>;
    if (res.Type !== 'AWS::CloudFormation::Stack') continue;

    const templateUrl = res.Properties?.TemplateURL;
    if (typeof templateUrl !== 'string') {
      skipped.push(logicalId);
      continue;
    }

    // Extract relative path after "amplify-cfn-templates/" → e.g. "storage/cloudformation-template.json"
    const prefixIdx = templateUrl.indexOf(S3_TEMPLATE_PATH_PREFIX);
    if (prefixIdx === -1) {
      skipped.push(logicalId);
      continue;
    }
    const relativePath = templateUrl.slice(prefixIdx + S3_TEMPLATE_PATH_PREFIX.length);
    const category = relativePath.split('/')[0];
    const filename = relativePath.split('/').pop()!;

    // Glob for the filename under the category subdirectory
    const matches = globSync(`${category}/**/${filename}`, { cwd: buildDir });
    if (matches.length !== 1) {
      skipped.push(logicalId);
      continue;
    }

    try {
      const templateBody = fs.readFileSync(path.join(buildDir, matches[0]), 'utf-8');
      resolved.set(logicalId, { templateBody, category });
    } catch {
      skipped.push(logicalId);
    }
  }

  return { resolved, skipped };
}

interface NestedChangeSetResult {
  changes: ResourceChange[];
  changeSetId?: string;
  skipped: boolean;
  skipReason?: string;
}

interface NestedStackTarget {
  logicalId: string;
  physicalId: string;
  templateBody: string;
  category: string;
}

const POLL_INTERVAL_MS = 2_000;
const PER_STACK_TIMEOUT_MS = 60_000;

/**
 * Delete any existing `amplify-drift-detection-*` changesets on a stack.
 * Prevents hitting the 50-changeset-per-stack CloudFormation limit across repeated runs.
 */
async function cleanupStaleChangesets(cfn: CloudFormationClient, stackName: string, print: Printer): Promise<void> {
  const staleIds: string[] = [];
  const paginator = paginateListChangeSets({ client: cfn }, { StackName: stackName });
  for await (const page of paginator) {
    for (const summary of page.Summaries ?? []) {
      if (summary.ChangeSetName?.startsWith(CHANGESET_PREFIX)) {
        staleIds.push(summary.ChangeSetName);
      }
    }
  }
  if (staleIds.length > 0) {
    print.debug(`Cleaning up ${staleIds.length} stale drift changeset(s) on ${stackName}`);
    await Promise.all(
      staleIds.map((name) => cfn.send(new DeleteChangeSetCommand({ StackName: stackName, ChangeSetName: name })).catch(() => {})),
    );
  }
}

/**
 * Create a changeset for a single stack, poll for completion, return changes.
 * Handles its own parameter fetching and cleanup.
 */
async function createAndPollChangeset(
  cfn: CloudFormationClient,
  stackName: string,
  templateBody: string,
  print: Printer,
): Promise<NestedChangeSetResult> {
  // Phase 0: Clean up stale drift changesets from prior runs
  try {
    await cleanupStaleChangesets(cfn, stackName, print);
  } catch (err: any) {
    print.debug(`Stale changeset cleanup failed for ${stackName}: ${err.message}`);
    // Non-fatal — continue with changeset creation
  }

  // Phase 1: Get deployed parameters
  let parameters: { ParameterKey: string; ParameterValue: string }[];
  try {
    const desc = await cfn.send(new DescribeStacksCommand({ StackName: stackName }));
    parameters = (desc.Stacks?.[0]?.Parameters ?? []) as { ParameterKey: string; ParameterValue: string }[];
  } catch (err: any) {
    return { changes: [], skipped: true, skipReason: `DescribeStacks failed: ${err.message}` };
  }

  // Phase 2: Create changeset
  const changeSetName = `${CHANGESET_PREFIX}${Date.now()}`;
  let changeSetId: string | undefined;
  try {
    print.debug(`Creating changeset ${changeSetName} on ${stackName}`);
    const res = await cfn.send(
      new CreateChangeSetCommand({
        StackName: stackName,
        ChangeSetName: changeSetName,
        TemplateBody: templateBody,
        Parameters: parameters,
        Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
        ChangeSetType: 'UPDATE',
      }),
    );
    changeSetId = res.Id;
  } catch (err: any) {
    return { changes: [], skipped: true, skipReason: `CreateChangeSet failed: ${err.message}` };
  }

  // Phase 3: Poll for completion (2s intervals, 60s timeout)
  const deadline = Date.now() + PER_STACK_TIMEOUT_MS;
  let finalStatus: DescribeChangeSetCommandOutput | undefined;
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      finalStatus = await cfn.send(new DescribeChangeSetCommand({ StackName: stackName, ChangeSetName: changeSetName }));
      const status = finalStatus.Status;
      print.debug(`Changeset ${changeSetName} status: ${status}`);
      if (status !== 'CREATE_PENDING' && status !== 'CREATE_IN_PROGRESS') break;
      if (Date.now() >= deadline) break;
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }

    if (!finalStatus || finalStatus.Status === 'CREATE_PENDING' || finalStatus.Status === 'CREATE_IN_PROGRESS') {
      // Timed out — clean up orphan
      cfn.send(new DeleteChangeSetCommand({ StackName: stackName, ChangeSetName: changeSetName })).catch(() => {});
      return { changes: [], skipped: true, skipReason: 'Changeset polling timed out' };
    }
  } catch (err: any) {
    // Poll failed — clean up orphan
    cfn.send(new DeleteChangeSetCommand({ StackName: stackName, ChangeSetName: changeSetName })).catch(() => {});
    return { changes: [], skipped: true, skipReason: `Polling failed: ${err.message}` };
  }

  // Phase 4: Interpret result and clean up
  if (finalStatus.Status === 'FAILED') {
    cfn.send(new DeleteChangeSetCommand({ StackName: stackName, ChangeSetName: changeSetName })).catch(() => {});
    if (finalStatus.StatusReason?.includes("didn't contain changes") || finalStatus.StatusReason?.includes('No updates')) {
      return { changes: [], skipped: false };
    }
    return { changes: [], skipped: true, skipReason: `Changeset failed: ${finalStatus.StatusReason}` };
  }

  const changes: ResourceChange[] = [];
  for (const c of finalStatus.Changes ?? []) {
    if (c.Type === 'Resource' && c.ResourceChange) {
      changes.push(c.ResourceChange);
    }
  }

  // Always delete the changeset — drift data is captured in the result
  print.debug(`Deleting changeset ${changeSetName} on ${stackName} (${changes.length} change(s) captured)`);
  cfn.send(new DeleteChangeSetCommand({ StackName: stackName, ChangeSetName: changeSetName })).catch(() => {});

  return { changes, skipped: false, changeSetId };
}

/**
 * Phase 2: Detect template drift using per-nested-stack CloudFormation change sets.
 *
 * Creates individual changesets for each nested stack rather than a single
 * IncludeNestedStacks changeset, avoiding EarlyValidation failures that
 * discard all results when one nested stack fails.
 */
export async function detectTemplateDrift(stackName: string, print: Printer, cfn: CloudFormationClient): Promise<TemplateDriftResults> {
  try {
    // Check prerequisites
    const currentCloudBackendPath = pathManager.getCurrentCloudBackendDirPath();
    if (!fs.existsSync(currentCloudBackendPath)) {
      return { changes: [], skipped: true, skipReason: 'No #current-cloud-backend found. Run "amplify pull" first.' };
    }

    const templatePath = path.join(currentCloudBackendPath, 'awscloudformation', 'build', 'root-cloudformation-stack.json');
    if (!fs.existsSync(templatePath)) {
      return { changes: [], skipped: true, skipReason: 'No cached CloudFormation template found' };
    }

    const rootTemplate = await fs.readJson(templatePath);
    const buildDir = path.join(currentCloudBackendPath, 'awscloudformation', 'build');

    // Step 1: resolve cached templates (sync), then enumerate deployed nested stacks
    const templateResolution = resolveNestedTemplates(rootTemplate, buildDir);
    const stackResources = await cfn.send(new DescribeStackResourcesCommand({ StackName: stackName }));

    // Build physical ID map from deployed nested stacks (skip deleted)
    const physicalIds = new Map<string, string>();
    for (const res of stackResources.StackResources ?? []) {
      if (
        res.ResourceType === 'AWS::CloudFormation::Stack' &&
        res.LogicalResourceId &&
        res.PhysicalResourceId &&
        !res.ResourceStatus?.includes('DELETE')
      ) {
        physicalIds.set(res.LogicalResourceId, res.PhysicalResourceId);
      }
    }

    // Step 2: Join — only process stacks present in both maps
    const targets: NestedStackTarget[] = [];
    for (const [logicalId, info] of templateResolution.resolved) {
      const physicalId = physicalIds.get(logicalId);
      if (physicalId) {
        targets.push({ logicalId, physicalId, templateBody: info.templateBody, category: info.category });
      } else {
        templateResolution.skipped.push(logicalId);
      }
    }

    if (targets.length === 0) {
      return { changes: [], skipped: true, skipReason: 'Could not resolve any nested stack templates' };
    }

    print.debug(`Template drift: ${targets.length} nested stacks to analyze, ${templateResolution.skipped.length} skipped`);

    // Step 3: Create per-nested-stack changesets with concurrency limit
    const limiter = new Bottleneck({ maxConcurrent: 3, minTime: 50 });
    const resultMap = new Map<string, NestedChangeSetResult>();

    await Promise.all(
      targets.map((t) =>
        limiter.schedule(async () => {
          print.debug(`Analyzing nested stack: ${t.logicalId}`);
          const result = await createAndPollChangeset(cfn, t.physicalId, t.templateBody, print);
          resultMap.set(t.logicalId, result);
          if (result.skipped) {
            print.debug(`  ${t.logicalId}: skipped — ${result.skipReason}`);
          } else {
            print.debug(`  ${t.logicalId}: ${result.changes.length} changes`);
          }
        }),
      ),
    );

    // Step 4: Assemble TemplateDriftResults
    const changes: ResourceChangeWithNested[] = [];
    const skippedStacks: string[] = [...templateResolution.skipped];

    for (const target of targets) {
      const result = resultMap.get(target.logicalId)!;
      if (result.skipped) {
        skippedStacks.push(target.logicalId);
        continue;
      }
      if (result.changes.length === 0) continue;

      // Synthetic ResourceChangeWithNested entry — the formatter expects this shape
      // to recurse into nestedChanges and extract category from LogicalResourceId
      const entry: ResourceChangeWithNested = {
        ResourceType: 'AWS::CloudFormation::Stack',
        LogicalResourceId: target.logicalId,
        PhysicalResourceId: target.physicalId,
        ChangeSetId: result.changeSetId,
        Action: 'Modify',
        nestedChanges: result.changes.map((c) => ({ ...c })),
      };
      changes.push(entry);
    }

    return {
      changes,
      skipped: false,
      skippedStacks: skippedStacks.length > 0 ? skippedStacks : undefined,
    };
  } catch (error: any) {
    print.debug(error.stack ?? error.message);
    return { changes: [], skipped: true, skipReason: `Error during template drift detection: ${error.message}` };
  }
}
