import { $TSContext, stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import {
  CloudFormationClient,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  DeleteChangeSetCommand,
  waitUntilChangeSetCreateComplete,
} from '@aws-sdk/client-cloudformation';
import fs from 'fs-extra';
import * as path from 'path';
import { CloudFormationService } from './services/cloudformation-service';
import type { Print } from '../drift';

export interface TemplateDriftResult {
  hasDrift: boolean;
  changes: ChangeSetChange[];
  error?: string;
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
 * Phase 2: Detect template drift using CloudFormation change sets
 * Inspired by CDK's cloudformation-diff implementation
 */
export async function detectTemplateDrift(context: $TSContext, print: Print): Promise<TemplateDriftResult> {
  const cfnService = new CloudFormationService(print);
  let cfn: CloudFormationClient;

  try {
    // Initialize CloudFormation client using the standard Amplify pattern
    cfn = await cfnService.getClient(context);

    // 1. Check prerequisites
    const currentCloudBackendPath = pathManager.getCurrentCloudBackendDirPath();
    print.debug(`Checking for #current-cloud-backend at: ${currentCloudBackendPath}`);
    if (!fs.existsSync(currentCloudBackendPath)) {
      return {
        hasDrift: false,
        changes: [],
        skipped: true,
        skipReason: 'No #current-cloud-backend found. Run "amplify pull" first.',
      };
    }

    // 2. Read configuration
    const teamProviderInfo = stateManager.getTeamProviderInfo();
    const localEnvInfo = stateManager.getLocalEnvInfo();
    const envName = localEnvInfo.envName;

    if (!teamProviderInfo[envName]) {
      return {
        hasDrift: false,
        changes: [],
        skipped: true,
        skipReason: `Environment "${envName}" not found in team-provider-info.json`,
      };
    }

    const stackInfo = teamProviderInfo[envName].awscloudformation;
    const stackName = stackInfo.StackName;
    print.debug(`Environment: ${envName}, Stack: ${stackName}`);

    // 3. Read cached template
    const templatePath = path.join(currentCloudBackendPath, 'awscloudformation', 'build', 'root-cloudformation-stack.json');
    print.debug(`Reading cached template from: ${templatePath}`);

    if (!fs.existsSync(templatePath)) {
      return {
        hasDrift: false,
        changes: [],
        skipped: true,
        skipReason: 'No cached CloudFormation template found',
      };
    }

    const template = await fs.readJson(templatePath);

    // 4. Prepare parameters
    const parameters = extractParameters(stackInfo, template);
    print.debug(`Extracted ${parameters.length} parameters from template`);

    // 5. Create changeset
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

    // 6. Wait for changeset to complete
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
      // Re-throw the error - the waiter already handles retries internally
      // No need for an additional describe attempt as the changeset likely doesn't exist or is in a bad state
      throw new Error(`Failed to create changeset: ${waitError.message || 'Unknown error'}`);
    }

    // 7. Describe the completed changeset
    const changeSet = await cfn.send(
      new DescribeChangeSetCommand({
        StackName: stackName,
        ChangeSetName: changeSetName,
      }),
    );

    // Debug: Print full changeset
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

    // 8. Cleanup
    try {
      print.debug(`Deleting changeset: ${changeSetName}`);
      await cfn.send(
        new DeleteChangeSetCommand({
          StackName: stackName,
          ChangeSetName: changeSetName,
        }),
      );
    } catch (deleteError: any) {
      // Log cleanup errors but don't fail the operation
      print.warn(`Failed to delete changeset ${changeSetName}: ${deleteError.message}`);
      print.warn('You may want to manually delete it from the AWS CloudFormation Console');
    }

    return result;
  } catch (error: any) {
    return {
      hasDrift: false,
      changes: [],
      error: error.message,
      skipped: true,
      skipReason: `Error during template drift detection: ${error.message}`,
    };
  }
}

function extractParameters(stackInfo: any, template: any): any[] {
  const parameters: any[] = [];

  // Extract parameters from template and match with team-provider-info values
  if (template.Parameters) {
    for (const paramName of Object.keys(template.Parameters)) {
      if (stackInfo[paramName]) {
        parameters.push({
          ParameterKey: paramName,
          ParameterValue: stackInfo[paramName],
        });
      }
    }
  }

  return parameters;
}

async function analyzeChangeSet(cfn: CloudFormationClient, changeSet: any, print: Print): Promise<TemplateDriftResult> {
  const result: TemplateDriftResult = {
    hasDrift: false,
    changes: [],
    skipped: false,
  };

  // Handle "No updates" case
  if (changeSet.Status === 'FAILED' && changeSet.StatusReason?.includes('No updates')) {
    print.debug('ChangeSet status: No updates detected');
    return result;
  }

  if (!changeSet.Changes || changeSet.Changes.length === 0) {
    print.debug('ChangeSet has no changes');
    return result;
  }

  result.hasDrift = true;
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
        // Extract stack name from physical resource ID
        const stackArn = rc.PhysicalResourceId;
        const stackName = stackArn.split('/')[1]; // Extract stack name from ARN

        // Extract changeset name from changeset ID
        const changeSetArn = rc.ChangeSetId;
        const changeSetName = changeSetArn.split('/')[1]; // Extract changeset name from ARN

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

        // Add nested changes to the current change
        if (nestedResult.changes && nestedResult.changes.length > 0) {
          changeInfo.nestedChanges = nestedResult.changes;
          print.debug(`Processed ${nestedResult.changes.length} nested changes`);
        }
      } catch (error: any) {
        // Log error but continue processing
        print.debug(`Could not fetch nested changeset: ${error.message}`);
        print.debug(`Stack ARN: ${rc.PhysicalResourceId}`);
        print.debug(`ChangeSet ID: ${rc.ChangeSetId}`);
      }
    }

    result.changes.push(changeInfo);
  }

  return result;
}
