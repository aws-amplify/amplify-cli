import { pathManager, parseArn } from '@aws-amplify/amplify-cli-core';
import {
  CloudFormationClient,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  DescribeChangeSetCommandOutput,
  DeleteChangeSetCommand,
  DescribeStacksCommand,
  waitUntilChangeSetCreateComplete,
  type ResourceChange,
} from '@aws-sdk/client-cloudformation';
import { paginateListChangeSets } from '@aws-sdk/client-cloudformation';
import fs from 'fs-extra';
import * as path from 'path';
import type { SpinningLogger } from '../gen2-migration/_common/spinning-logger';

/** A CloudFormation resource change that may contain recursive nested stack changes. */
export interface ResourceChangeWithNested extends ResourceChange {
  nestedChanges?: ResourceChangeWithNested[];
}

/** Results from template drift detection via CloudFormation change sets. */
export interface TemplateDriftResults {
  readonly changes: ResourceChangeWithNested[];
  readonly skipped: boolean;
  readonly skipReason?: string;
  readonly changeSetId?: string;
  readonly incompleteStacks?: string[];
}

/**
 * Extract stack name from CloudFormation stack ARN
 * @param stackArn - Stack ARN in format: arn:aws:cloudformation:region:account:stack/stackName/guid
 * @returns Stack name extracted from the ARN resource portion
 */
function extractStackNameFromArn(stackArn: string): string {
  // Stack ARN resource format: "stack/stackName/guid"
  const resource = parseArn(stackArn).resource;
  return resource.split('/')[1];
}

/**
 * Extract changeset name from CloudFormation changeset ARN
 * @param changeSetArn - ChangeSet ARN in format: arn:aws:cloudformation:region:account:changeSet/changeSetName/id
 * @returns ChangeSet name extracted from the ARN resource portion
 */
function extractChangeSetNameFromArn(changeSetArn: string): string {
  // ChangeSet ARN resource format: "changeSet/changeSetName/id"
  const resource = parseArn(changeSetArn).resource;
  return resource.split('/')[1];
}

function isRecoverableFailure(reason?: string): boolean {
  if (!reason) return false;
  // EarlyValidation failures (e.g., ResourceExistenceCheck) — Changes are populated
  if (reason.includes('EarlyValidation')) return true;
  // Template format errors (e.g., duplicate Export names from Fn::Join in nested stacks) —
  // Changes are partially populated. CFN validates exports after building the change list,
  // so some changes are available even though the changeset ultimately failed.
  if (reason.includes('Template format error')) return true;
  return false;
}

/**
 * Check whether a root changeset failed because of a nested changeset failure.
 * Uses structural inspection: the Changes array contains at least one CloudFormation::Stack
 * entry with a ChangeSetId, indicating nested changesets exist to recurse into.
 */
function hasNestedChangeSetFailure(changeSet: DescribeChangeSetCommandOutput): boolean {
  return (
    changeSet.Changes?.some((c) => c.ResourceChange?.ResourceType === 'AWS::CloudFormation::Stack' && c.ResourceChange?.ChangeSetId) ??
    false
  );
}

const CHANGESET_PREFIX = 'amplify-drift-detection-';

/**
 * Delete any existing amplify-drift-detection-* changesets from a previous run
 */
async function cleanupOldDriftChangesets(cfn: CloudFormationClient, stackName: string, print: SpinningLogger): Promise<void> {
  try {
    const toDelete: string[] = [];
    for await (const page of paginateListChangeSets({ client: cfn }, { StackName: stackName })) {
      for (const cs of page.Summaries || []) {
        if (cs.ChangeSetName?.startsWith(CHANGESET_PREFIX)) {
          toDelete.push(cs.ChangeSetName);
        }
      }
    }
    await Promise.allSettled(
      toDelete.map((name) => {
        print.debug(`Deleting old drift changeset: ${name}`);
        return cfn.send(new DeleteChangeSetCommand({ StackName: stackName, ChangeSetName: name }));
      }),
    );
  } catch (error: any) {
    print.debug(`Failed to clean up old drift changesets: ${error.message}`);
  }
}

/**
 * Phase 2: Detect template drift using CloudFormation change sets
 * Inspired by CDK's cloudformation-diff implementation
 *
 * @param stackName - The CloudFormation stack name to check
 * @param print - Logging interface
 * @param cfn - CloudFormation client
 */
export async function detectTemplateDrift(
  stackName: string,
  print: SpinningLogger,
  cfn: CloudFormationClient,
): Promise<TemplateDriftResults> {
  try {
    // Check prerequisites
    const currentCloudBackendPath = pathManager.getCurrentCloudBackendDirPath();
    print.debug(`Checking for #current-cloud-backend at: ${currentCloudBackendPath}`);
    if (!fs.existsSync(currentCloudBackendPath)) {
      return {
        changes: [],
        skipped: true,
        skipReason: 'No #current-cloud-backend found. Run "amplify pull" first.',
      };
    }

    // Read cached template
    const templatePath = path.join(currentCloudBackendPath, 'awscloudformation', 'build', 'root-cloudformation-stack.json');
    print.debug(`Reading cached template from: ${templatePath}`);

    if (!fs.existsSync(templatePath)) {
      return {
        changes: [],
        skipped: true,
        skipReason: 'No cached CloudFormation template found',
      };
    }

    const template = await fs.readJson(templatePath);

    // Get current stack parameters from CloudFormation (source of truth)
    print.debug(`Fetching stack parameters from CloudFormation for: ${stackName}`);
    const stackDescription = await cfn.send(
      new DescribeStacksCommand({
        StackName: stackName,
      }),
    );

    if (!stackDescription.Stacks || stackDescription.Stacks.length === 0) {
      return {
        changes: [],
        skipped: true,
        skipReason: `Stack ${stackName} not found in CloudFormation`,
      };
    }

    // Use parameters from the deployed stack
    const parameters = stackDescription.Stacks[0].Parameters || [];
    print.debug(`Using ${parameters.length} parameters from deployed stack`);

    // Clean up changesets from previous drift detection runs
    await cleanupOldDriftChangesets(cfn, stackName, print);

    // Create changeset
    const changeSetName = `${CHANGESET_PREFIX}${Date.now()}`;
    print.debug(`Creating changeset: ${changeSetName}`);

    await cfn.send(
      new CreateChangeSetCommand({
        StackName: stackName,
        ChangeSetName: changeSetName,
        TemplateBody: JSON.stringify(template),
        Parameters: parameters,
        Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
        ChangeSetType: 'UPDATE',
        IncludeNestedStacks: true, // Include nested stack changes
      }),
    );

    // Wait for changeset to complete (may succeed or fail)
    try {
      await waitUntilChangeSetCreateComplete(
        {
          client: cfn,
          maxWaitTime: 300,
        },
        {
          StackName: stackName,
          ChangeSetName: changeSetName,
        },
      );
    } catch (waitError: any) {
      print.debug(`Changeset waiter failed, will check status...`);
    }

    const changeSet = await cfn.send(
      new DescribeChangeSetCommand({
        StackName: stackName,
        ChangeSetName: changeSetName,
      }),
    );

    // Handle "no changes" case - this is SUCCESS for drift detection
    if (changeSet.Status === 'FAILED' && changeSet.StatusReason?.includes("didn't contain changes")) {
      print.debug('✓ Changeset status: No changes detected (no drift)');
      // No drift to inspect — clean up immediately
      await cfn
        .send(new DeleteChangeSetCommand({ StackName: stackName, ChangeSetName: changeSetName }))
        .catch((e: any) => print.debug(`Failed to delete changeset: ${e.message}`));
      return {
        changes: [],
        skipped: false,
      };
    }

    // Handle other FAILED cases — nested stacks may still have usable data.
    // The root changeset's StatusReason references the first failing nested changeset
    // (e.g., "Nested change set <ARN> was not successfully created: Currently in FAILED.")
    // but does NOT contain "EarlyValidation". Classification happens per-nested-stack
    // in analyzeChangeSet, so we fall through here.
    if (changeSet.Status === 'FAILED') {
      print.warn(`Root changeset FAILED: ${changeSet.StatusReason}`);
    }

    print.debug(`CloudFormation ChangeSet: ${stackName}`);
    print.debug(`Status: ${changeSet.Status}`);
    print.debug(`IncludeNestedStacks: ${changeSet.IncludeNestedStacks}`);
    if (changeSet.StatusReason) {
      print.debug(`StatusReason: ${changeSet.StatusReason}`);
    }
    if (changeSet.Changes && changeSet.Changes.length > 0) {
      print.debug(`Changes: ${changeSet.Changes.length}`);
      for (const change of changeSet.Changes) {
        if (change.ResourceChange) {
          const rc = change.ResourceChange;
          print.debug(`  ${rc.LogicalResourceId} (${rc.ResourceType}) - ${rc.Action}`);
        }
      }
    } else {
      print.debug('Changes: 0');
    }

    // Changeset is kept for user inspection via console URL — cleaned up on next run
    const result = await analyzeChangeSet(cfn, changeSet, print, true);
    return { ...result, changeSetId: changeSet.ChangeSetId };
  } catch (error: any) {
    return {
      changes: [],
      skipped: true,
      skipReason: `Error during template drift detection: ${error.message}`,
    };
  }
}

async function analyzeChangeSet(
  cfn: CloudFormationClient,
  changeSet: DescribeChangeSetCommandOutput,
  print: SpinningLogger,
  isRoot = false,
): Promise<TemplateDriftResults> {
  const result: TemplateDriftResults = {
    changes: [],
    skipped: false,
  };

  // Track which nested stacks could not be fully analyzed
  const skippedStacks: string[] = [];

  // Reject non-terminal statuses immediately (e.g. CREATE_IN_PROGRESS after waiter timeout)
  const terminalStatuses = ['CREATE_COMPLETE', 'FAILED'];
  if (!terminalStatuses.includes(changeSet.Status ?? '')) {
    print.warn(`Changeset in non-terminal status: ${changeSet.Status}`);
    return {
      changes: [],
      skipped: true,
      skipReason: `Changeset in non-terminal status: ${changeSet.Status}`,
    };
  }

  // Handle FAILED status — classify by failure type
  if (changeSet.Status === 'FAILED') {
    // "No changes" is success for drift detection
    if (changeSet.StatusReason?.includes("didn't contain changes") || changeSet.StatusReason?.includes('No updates')) {
      print.debug(`ChangeSet has no updates: ${changeSet.StatusReason}`);
      return result;
    }

    // Recoverable failures (EarlyValidation, Template format errors) still have Changes populated.
    // However, if Changes is empty despite the recoverable classification, treat as incomplete.
    if (isRecoverableFailure(changeSet.StatusReason)) {
      if (!changeSet.Changes || changeSet.Changes.length === 0) {
        print.warn(`Recoverable failure but no Changes populated: ${changeSet.StatusReason}`);
        return {
          changes: [],
          skipped: true,
          skipReason: `Changeset failed with no usable changes: ${changeSet.StatusReason}`,
        };
      }
      print.warn(`Nested changeset FAILED (recoverable): ${changeSet.StatusReason}`);
    } else if (isRoot && hasNestedChangeSetFailure(changeSet)) {
      // Root changeset FAILED because a nested changeset failed. Classification must happen
      // per-nested-stack, so fall through to process Changes.
      if (!changeSet.Changes || changeSet.Changes.length === 0) {
        print.warn(`Root changeset FAILED with nested failure but no Changes to analyze: ${changeSet.StatusReason}`);
        return {
          changes: [],
          skipped: true,
          skipReason: `Changeset failed with no usable changes: ${changeSet.StatusReason || 'Unknown reason'}`,
        };
      }
      print.debug(`Root changeset FAILED due to nested failure — falling through to analyze nested changesets`);
    } else {
      // Unknown failure — treat as genuine error, skip this changeset
      print.warn(`ChangeSet failed with unexpected reason: ${changeSet.StatusReason || 'No reason provided'}`);
      return {
        changes: [],
        skipped: true,
        skipReason: `Changeset failed: ${changeSet.StatusReason || 'Unknown reason'}`,
      };
    }
  }

  // Check if there are no changes (CREATE_COMPLETE with no drift)
  if (!changeSet.Changes || changeSet.Changes.length === 0) {
    print.debug('ChangeSet has no changes');
    return result;
  }

  print.debug(`Analyzing ${changeSet.Changes.length} changes from changeset`);

  // Analyze each change (CDK-inspired approach)
  for (const change of changeSet.Changes) {
    if (change.Type !== 'Resource' || !change.ResourceChange) {
      continue;
    }

    const rc = change.ResourceChange;
    const changeInfo: ResourceChangeWithNested = { ...rc };

    // Check if this is a nested stack with its own changeset
    if (rc.ResourceType === 'AWS::CloudFormation::Stack' && rc.ChangeSetId && rc.PhysicalResourceId) {
      try {
        // Extract stack name and changeset name from ARNs using parseArn utility
        const stackName = extractStackNameFromArn(rc.PhysicalResourceId);
        const changeSetName = extractChangeSetNameFromArn(rc.ChangeSetId);

        print.debug(`Fetching nested changeset: ${stackName}`);
        print.debug(`ChangeSet: ${changeSetName}`);

        // Wait for nested changeset to reach terminal status.
        // The root changeset fails as soon as any nested changeset fails,
        // but other nested changesets may still be CREATE_IN_PROGRESS.
        try {
          await waitUntilChangeSetCreateComplete({ client: cfn, maxWaitTime: 120 }, { StackName: stackName, ChangeSetName: changeSetName });
        } catch (waitError: any) {
          print.debug(`Nested changeset waiter for ${stackName} finished with: ${waitError.message}`);
        }
        const nestedChangeSet = await cfn.send(
          new DescribeChangeSetCommand({
            StackName: stackName,
            ChangeSetName: changeSetName,
          }),
        );
        if (!terminalStatuses.includes(nestedChangeSet.Status ?? '')) {
          print.warn(`Nested changeset ${stackName} did not reach terminal status (${nestedChangeSet.Status})`);
          skippedStacks.push(stackName);
          result.changes.push(changeInfo);
          continue;
        }

        // Print nested changeset details
        if (nestedChangeSet.Changes && nestedChangeSet.Changes.length > 0) {
          print.debug(`Nested Stack: ${stackName}`);
          print.debug(`Nested Changes: ${nestedChangeSet.Changes.length}`);
          for (const nestedChange of nestedChangeSet.Changes) {
            if (nestedChange.ResourceChange) {
              const nrc = nestedChange.ResourceChange;
              print.debug(`  ${nrc.LogicalResourceId} (${nrc.ResourceType}) - ${nrc.Action}`);
              if (nrc.ResourceType === 'AWS::CloudFormation::Stack' && nrc.ChangeSetId) {
                print.debug(`    Has nested changeset (3rd level or deeper)`);
              }
            }
          }
        }

        // Recursively analyze nested changeset
        const nestedResult = await analyzeChangeSet(cfn, nestedChangeSet, print);

        // Track if nested analysis was skipped
        if (nestedResult.skipped) {
          print.warn(`⚠ Nested stack ${stackName} analysis was skipped: ${nestedResult.skipReason}`);
          skippedStacks.push(stackName);
        }

        // Propagate incomplete stacks from deeper nesting levels
        if (nestedResult.incompleteStacks) {
          skippedStacks.push(...nestedResult.incompleteStacks);
        }

        // Add nested changes to the current change
        if (nestedResult.changes && nestedResult.changes.length > 0) {
          changeInfo.nestedChanges = nestedResult.changes;
          print.debug(`Processed ${nestedResult.changes.length} nested changes`);
        }
      } catch (error: any) {
        // Log error and track as incomplete. Use LogicalResourceId as fallback
        // since extractStackNameFromArn could throw on malformed ARNs.
        print.warn(`⚠ Could not fetch nested changeset for ${rc.LogicalResourceId}: ${error.message}`);
        print.debug(`Stack ARN: ${rc.PhysicalResourceId}`);
        print.debug(`ChangeSet ID: ${rc.ChangeSetId}`);
        try {
          skippedStacks.push(extractStackNameFromArn(rc.PhysicalResourceId));
        } catch {
          // extractStackNameFromArn failed on a malformed ARN — fall back to logical ID
          skippedStacks.push(rc.LogicalResourceId || 'unknown');
        }
      }
    }

    result.changes.push(changeInfo);
  }

  if (skippedStacks.length > 0) {
    return { ...result, incompleteStacks: skippedStacks };
  }

  return result;
}
