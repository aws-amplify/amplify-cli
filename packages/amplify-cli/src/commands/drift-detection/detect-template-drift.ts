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
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import Bottleneck from 'bottleneck';
import fs from 'fs-extra';
import * as path from 'path';
import type { SpinningLogger } from '../gen2-migration/_infra/spinning-logger';

export interface ResourceChangeWithNested extends ResourceChange {
  nestedChanges?: ResourceChangeWithNested[];
}

export interface TemplateDriftResults {
  changes: ResourceChangeWithNested[];
  incomplete: boolean;
  skipReason?: string;
  skippedStacks?: string[];
}

const CHANGESET_PREFIX = 'amplify-drift-detection-';

/**
 * Parse an S3 URL into bucket and key components.
 * Supports common S3 URL formats:
 *   - https://s3.amazonaws.com/{bucket}/{key}
 *   - https://{bucket}.s3.amazonaws.com/{key}
 *   - https://s3.{region}.amazonaws.com/{bucket}/{key}
 *   - https://{bucket}.s3.{region}.amazonaws.com/{key}
 *
 * Returns undefined for unrecognizable URLs (e.g. Fn::Sub / Fn::Join intrinsics).
 */
function parseS3Url(url: string): { Bucket: string; Key: string } | undefined {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const pathParts = parsed.pathname.replace(/^\//, '').split('/');

    // https://s3.amazonaws.com/{bucket}/{key} or https://s3.{region}.amazonaws.com/{bucket}/{key}
    if (host.startsWith('s3.') || host === 's3.amazonaws.com') {
      if (pathParts.length < 2) return undefined;
      return { Bucket: pathParts[0], Key: pathParts.slice(1).join('/') };
    }

    // https://{bucket}.s3.amazonaws.com/{key} or https://{bucket}.s3.{region}.amazonaws.com/{key}
    const bucketMatch = host.match(/^(.+?)\.s3[.\-]/);
    if (bucketMatch) {
      if (pathParts.length < 1 || !pathParts[0]) return undefined;
      return { Bucket: bucketMatch[1], Key: pathParts.join('/') };
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Fetch nested stack templates from S3 by parsing TemplateURL values in the root template.
 * This mirrors how CloudFormation's IncludeNestedStacks worked — fetching actual deployed templates from S3.
 */
async function fetchNestedTemplatesFromS3(
  rootTemplate: Record<string, any>,
  s3: S3Client,
  print: SpinningLogger,
): Promise<{ resolved: Map<string, string>; skipped: string[] }> {
  const resolved = new Map<string, string>();
  const skipped: string[] = [];

  for (const [logicalId, resource] of Object.entries(rootTemplate.Resources || {})) {
    const res = resource as Record<string, any>;
    if (res.Type !== 'AWS::CloudFormation::Stack') continue;

    const templateUrl = res.Properties?.TemplateURL;
    if (typeof templateUrl !== 'string') {
      // Intrinsic function (Fn::Sub, Fn::Join) — cannot resolve statically
      skipped.push(logicalId);
      continue;
    }

    const s3Location = parseS3Url(templateUrl);
    if (!s3Location) {
      print.debug(`Cannot parse TemplateURL for ${logicalId}: ${templateUrl}`);
      skipped.push(logicalId);
      continue;
    }

    try {
      const response = await s3.send(new GetObjectCommand(s3Location));
      const body = await response.Body?.transformToString();
      if (body) {
        resolved.set(logicalId, body);
      } else {
        skipped.push(logicalId);
      }
    } catch (err: any) {
      print.debug(`S3 fetch failed for ${logicalId} (${s3Location.Bucket}/${s3Location.Key}): ${err.message}`);
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
}

const POLL_INTERVAL_MS = 2_000;
const PER_STACK_TIMEOUT_MS = 60_000;

/**
 * Delete any existing `amplify-drift-detection-*` changesets on a stack.
 * Prevents hitting the 50-changeset-per-stack CloudFormation limit across repeated runs.
 */
async function cleanupStaleChangesets(cfn: CloudFormationClient, stackName: string, print: SpinningLogger): Promise<void> {
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
  print: SpinningLogger,
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

  // Phase 4: Interpret result
  if (finalStatus.Status === 'FAILED') {
    if (finalStatus.StatusReason?.includes("didn't contain changes") || finalStatus.StatusReason?.includes('No updates')) {
      return { changes: [], skipped: false };
    }
    // EarlyValidation / ResourceNotFound / "resource does not exist" means a resource was moved between stacks — this IS drift
    if (/EarlyValidation|ResourceNotFound|resource.*does not exist/i.test(finalStatus.StatusReason ?? '')) {
      print.debug(`EarlyValidation drift detected on ${stackName}: ${finalStatus.StatusReason}`);
      const syntheticChange: ResourceChange = {
        Action: 'Modify',
        ResourceType: 'AWS::CloudFormation::Stack',
        LogicalResourceId: stackName,
        Replacement: 'False',
        Scope: ['Properties'],
      };
      return { changes: [syntheticChange], skipped: false, changeSetId };
    }
    return { changes: [], skipped: true, skipReason: `Changeset failed: ${finalStatus.StatusReason}` };
  }

  // Paginate DescribeChangeSet to collect all changes (NextToken support)
  const changes: ResourceChange[] = [];
  let currentPage: DescribeChangeSetCommandOutput = finalStatus;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    for (const c of currentPage.Changes ?? []) {
      if (c.Type === 'Resource' && c.ResourceChange) {
        changes.push(c.ResourceChange);
      }
    }
    if (!currentPage.NextToken) break;
    currentPage = await cfn.send(new DescribeChangeSetCommand({ StackName: stackName, ChangeSetName: changeSetName, NextToken: currentPage.NextToken }));
  }

  // Do NOT delete changesets after analysis — let cleanupStaleChangesets handle
  // cleanup on the next run so changeset IDs in the output remain inspectable.

  return { changes, skipped: false, changeSetId };
}

/**
 * Check if a resource change is solely a DeletionPolicy addition (e.g. from `amplify lock`).
 * These are intentional and should be filtered out of drift results.
 */
function isDeletionPolicyOnlyChange(change: ResourceChange): boolean {
  if (!change.Details || change.Details.length === 0) {
    // No details — check Scope as a fallback
    return change.Scope?.length === 1 && change.Scope[0] === 'DeletionPolicy';
  }
  return change.Details.every((detail) => detail.Target?.Attribute === 'DeletionPolicy');
}

/**
 * Phase 2: Detect template drift using per-nested-stack CloudFormation change sets.
 *
 * Creates individual changesets for each nested stack rather than a single
 * IncludeNestedStacks changeset, avoiding EarlyValidation failures that
 * discard all results when one nested stack fails.
 */
export async function detectTemplateDrift(stackName: string, print: SpinningLogger, cfn: CloudFormationClient, s3?: S3Client): Promise<TemplateDriftResults> {
  const s3Client = s3 ?? new S3Client({});
  try {
    // Check prerequisites
    const currentCloudBackendPath = pathManager.getCurrentCloudBackendDirPath();
    if (!fs.existsSync(currentCloudBackendPath)) {
      return { changes: [], incomplete: true, skipReason: 'No #current-cloud-backend found. Run "amplify pull" first.' };
    }

    const templatePath = path.join(currentCloudBackendPath, 'awscloudformation', 'build', 'root-cloudformation-stack.json');
    if (!fs.existsSync(templatePath)) {
      return { changes: [], incomplete: true, skipReason: 'No cached CloudFormation template found' };
    }

    const rootTemplate = await fs.readJson(templatePath);
    const rootTemplateBody = JSON.stringify(rootTemplate);

    // Step 0: Create a root changeset (IncludeNestedStacks defaults to false)
    print.debug('Creating root stack changeset for template drift detection');
    const rootResult = await createAndPollChangeset(cfn, stackName, rootTemplateBody, print);

    // Step 1: Fetch nested stack templates from S3, then enumerate deployed nested stacks
    const templateResolution = await fetchNestedTemplatesFromS3(rootTemplate, s3Client, print);
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
    for (const [logicalId, templateBody] of templateResolution.resolved) {
      const physicalId = physicalIds.get(logicalId);
      if (physicalId) {
        targets.push({ logicalId, physicalId, templateBody });
      } else {
        templateResolution.skipped.push(logicalId);
      }
    }

    if (targets.length === 0) {
      return { changes: [], incomplete: true, skipReason: 'Could not resolve any nested stack templates' };
    }

    print.debug(`Template drift: ${targets.length} nested stacks to analyze, ${templateResolution.skipped.length} skipped`);

    // Step 3: Create per-nested-stack changesets with concurrency limit
    const limiter = new Bottleneck({ maxConcurrent: 3, minTime: 50 });

    const settledResults = await Promise.allSettled(
      targets.map((t) =>
        limiter.schedule(async () => {
          print.debug(`Analyzing nested stack: ${t.logicalId}`);
          const result = await createAndPollChangeset(cfn, t.physicalId, t.templateBody, print);
          if (result.skipped) {
            print.debug(`  ${t.logicalId}: skipped — ${result.skipReason}`);
          } else {
            print.debug(`  ${t.logicalId}: ${result.changes.length} changes`);
          }
          return { logicalId: t.logicalId, physicalId: t.physicalId, result };
        }),
      ),
    );

    // Step 4: Assemble TemplateDriftResults
    const changes: ResourceChangeWithNested[] = [];
    const skippedStacks: string[] = [...templateResolution.skipped];

    // Include root stack changes (non-nested resources like DeploymentBucket, AuthRole, UnauthRole)
    if (rootResult.skipped) {
      print.debug(`Root stack changeset skipped: ${rootResult.skipReason}`);
    } else if (rootResult.changes.length > 0) {
      for (const c of rootResult.changes) {
        if (!isDeletionPolicyOnlyChange(c)) {
          changes.push({ ...c });
        }
      }
    }

    for (const settled of settledResults) {
      if (settled.status === 'rejected') {
        // Promise itself rejected (unexpected) — record as skipped
        print.debug(`Nested stack processing rejected: ${settled.reason}`);
        continue;
      }
      const { logicalId, physicalId, result } = settled.value;
      if (result.skipped) {
        skippedStacks.push(logicalId);
        continue;
      }
      if (result.changes.length === 0) continue;

      // Filter out DeletionPolicy-only changes (e.g. from `amplify lock`)
      const filteredChanges = result.changes.filter((c) => !isDeletionPolicyOnlyChange(c));
      if (filteredChanges.length === 0) continue;

      // Synthetic ResourceChangeWithNested entry — the formatter expects this shape
      // to recurse into nestedChanges and extract category from LogicalResourceId
      const entry: ResourceChangeWithNested = {
        ResourceType: 'AWS::CloudFormation::Stack',
        LogicalResourceId: logicalId,
        PhysicalResourceId: physicalId,
        ChangeSetId: result.changeSetId,
        Action: 'Modify',
        nestedChanges: filteredChanges.map((c) => ({ ...c })),
      };
      changes.push(entry);
    }

    return {
      changes,
      incomplete: skippedStacks.length > 0,
      skippedStacks: skippedStacks.length > 0 ? skippedStacks : undefined,
    };
  } catch (error: any) {
    print.debug(error.stack ?? error.message);
    return { changes: [], incomplete: true, skipReason: `Error during template drift detection: ${error.message}` };
  }
}
