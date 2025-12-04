import { pathManager, parseArn } from '@aws-amplify/amplify-cli-core';
import {
  CloudFormationClient,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  DescribeChangeSetCommandOutput,
  DeleteChangeSetCommand,
  DescribeStacksCommand,
  waitUntilChangeSetCreateComplete,
} from '@aws-sdk/client-cloudformation';
import fs from 'fs-extra';
import * as path from 'path';
import type { Print } from '../drift';

export interface TemplateDriftResults {
  totalDrifted: number;
  changes: ChangeSetChange[];
  skipped: boolean;
  skipReason?: string;
}

interface ChangeSetChange {
  logicalResourceId: string;
  resourceType: string;
  action: string;
  replacement: boolean;
  details?: ChangeDetail[];
  nestedChanges?: ChangeSetChange[]; // Add nested changes support
}

interface ChangeDetail {
  attribute?: string;
  name?: string;
  changeSource?: string;
  evaluation?: string;
  requiresRecreation?: string;
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

/**
 * Phase 2: Detect template drift using CloudFormation change sets
 * Inspired by CDK's cloudformation-diff implementation
 *
 * @param stackName - The CloudFormation stack name to check
 * @param print - Logging interface
 * @param cfn - CloudFormation client
 */
export async function detectTemplateDrift(stackName: string, print: Print, cfn: CloudFormationClient): Promise<TemplateDriftResults> {
  try {
    // Check prerequisites
    const currentCloudBackendPath = pathManager.getCurrentCloudBackendDirPath();
    print.debug(`Checking for #current-cloud-backend at: ${currentCloudBackendPath}`);
    if (!fs.existsSync(currentCloudBackendPath)) {
      return {
        totalDrifted: 0,
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
        totalDrifted: 0,
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
        totalDrifted: 0,
        changes: [],
        skipped: true,
        skipReason: `Stack ${stackName} not found in CloudFormation`,
      };
    }

    // Use parameters from the deployed stack
    const parameters = stackDescription.Stacks[0].Parameters || [];
    print.debug(`Using ${parameters.length} parameters from deployed stack`);

    // Create changeset
    const changeSetName = `amplify-drift-detection-${Date.now()}`;
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

    try {
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
        return {
          totalDrifted: 0,
          changes: [],
          skipped: false,
        };
      }

      // Handle other failure cases
      if (changeSet.Status === 'FAILED') {
        print.debug(`Changeset failed with status: ${changeSet.Status}`);
        print.debug(`Reason: ${changeSet.StatusReason}`);
        const errorMsg = `Changeset creation failed with status ${changeSet.Status}`;
        const reasonMsg = changeSet.StatusReason ? `: ${changeSet.StatusReason}` : '';
        throw new Error(`${errorMsg}${reasonMsg}`);
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

      const result = await analyzeChangeSet(cfn, changeSet, print);
      return result;
    } finally {
      try {
        print.debug(`Deleting changeset: ${changeSetName}`);
        await cfn.send(
          new DeleteChangeSetCommand({
            StackName: stackName,
            ChangeSetName: changeSetName,
          }),
        );
        print.debug(`Deleted changeset: ${changeSetName}`);
      } catch (deleteError: any) {
        // Log cleanup errors but don't fail the operation
        print.warn(`Failed to delete changeset ${changeSetName}: ${deleteError.message}`);
      }
    }
  } catch (error: any) {
    return {
      totalDrifted: 0,
      changes: [],
      skipped: true,
      skipReason: `Error during template drift detection: ${error.message}`,
    };
  }
}

async function analyzeChangeSet(
  cfn: CloudFormationClient,
  changeSet: DescribeChangeSetCommandOutput,
  print: Print,
): Promise<TemplateDriftResults> {
  const result: TemplateDriftResults = {
    totalDrifted: 0,
    changes: [],
    skipped: false,
  };

  // Track if any nested stack analysis was skipped
  let hasNestedSkipped = false;

  // Handle FAILED status - distinguish between "no changes" vs actual errors
  if (changeSet.Status === 'FAILED') {
    // "No changes" is success for drift detection
    if (changeSet.StatusReason?.includes("didn't contain changes") || changeSet.StatusReason?.includes('No updates')) {
      print.debug(`ChangeSet has no updates: ${changeSet.StatusReason}`);
      return result;
    }

    // Other FAILED reasons are actual errors - mark as skipped
    print.warn(`ChangeSet failed with unexpected reason: ${changeSet.StatusReason || 'No reason provided'}`);
    return {
      totalDrifted: 0,
      changes: [],
      skipped: true,
      skipReason: `Changeset failed: ${changeSet.StatusReason || 'Unknown reason'}`,
    };
  }

  // Check if there are no changes
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
    const changeInfo: ChangeSetChange = {
      logicalResourceId: rc.LogicalResourceId,
      resourceType: rc.ResourceType,
      action: rc.Action,
      replacement: rc.Replacement === 'True',
      details: [],
      nestedChanges: [], // Add nested changes array
    };

    // Extract details
    if (rc.Details) {
      for (const detail of rc.Details) {
        changeInfo.details?.push({
          attribute: detail.Target?.Attribute,
          name: detail.Target?.Name,
          changeSource: detail.ChangeSource,
          evaluation: detail.Evaluation,
          requiresRecreation: detail.Target?.RequiresRecreation,
        });
      }
    }

    // Check if this is a nested stack with its own changeset
    if (rc.ResourceType === 'AWS::CloudFormation::Stack' && rc.ChangeSetId) {
      try {
        // Extract stack name and changeset name from ARNs using parseArn utility
        const stackName = extractStackNameFromArn(rc.PhysicalResourceId);
        const changeSetName = extractChangeSetNameFromArn(rc.ChangeSetId);

        print.debug(`Fetching nested changeset: ${stackName}`);
        print.debug(`ChangeSet: ${changeSetName}`);

        // Describe the nested changeset
        const nestedChangeSet = await cfn.send(
          new DescribeChangeSetCommand({
            StackName: stackName,
            ChangeSetName: changeSetName,
          }),
        );

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

        // Check if nested analysis was skipped
        if (nestedResult.skipped) {
          print.warn(`⚠ Nested stack ${stackName} analysis was skipped: ${nestedResult.skipReason}`);
          hasNestedSkipped = true;
        }

        // Add nested changes to the current change
        if (nestedResult.changes && nestedResult.changes.length > 0) {
          changeInfo.nestedChanges = nestedResult.changes;
          print.debug(`Processed ${nestedResult.changes.length} nested changes`);
        }
      } catch (error: any) {
        // Log error and mark as skipped
        print.warn(`⚠ Could not fetch nested changeset for ${rc.LogicalResourceId}: ${error.message}`);
        print.debug(`Stack ARN: ${rc.PhysicalResourceId}`);
        print.debug(`ChangeSet ID: ${rc.ChangeSetId}`);
        hasNestedSkipped = true;
      }
    }

    result.changes.push(changeInfo);
  }

  // If any nested stack analysis was skipped, mark entire result as skipped
  if (hasNestedSkipped) {
    return {
      totalDrifted: 0,
      changes: [],
      skipped: true,
      skipReason: 'One or more nested stacks could not be analyzed',
    };
  }

  // Set totalDrifted to the count of changes
  result.totalDrifted = result.changes.length;
  return result;
}
