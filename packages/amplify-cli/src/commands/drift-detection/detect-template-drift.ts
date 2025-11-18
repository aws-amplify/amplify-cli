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

export interface TemplateDriftResult {
  hasTemplateDrift: boolean;
  hasRealDrift: boolean; // Excludes nested stack false positives
  changes: ChangeSetChange[];
  nestedStackQuirks: string[]; // List of nested stacks with false positives
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

interface ChangeSetChange {
  logicalResourceId: string;
  resourceType: string;
  action: string;
  replacement: boolean;
  isRealChange: boolean;
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
export class TemplateDriftDetector {
  private cfn: CloudFormationClient;
  private context: $TSContext;

  constructor(context: $TSContext) {
    this.context = context;
    const region = stateManager.getMeta()?.providers?.awscloudformation?.Region || 'us-east-1';
    this.cfn = new CloudFormationClient({ region });
  }

  async detect(): Promise<TemplateDriftResult> {
    try {
      // 1. Check prerequisites
      const currentCloudBackendPath = pathManager.getCurrentCloudBackendDirPath();
      if (!fs.existsSync(currentCloudBackendPath)) {
        return {
          hasTemplateDrift: false,
          hasRealDrift: false,
          changes: [],
          nestedStackQuirks: [],
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
          hasTemplateDrift: false,
          hasRealDrift: false,
          changes: [],
          nestedStackQuirks: [],
          skipped: true,
          skipReason: `Environment "${envName}" not found in team-provider-info.json`,
        };
      }

      const stackInfo = teamProviderInfo[envName].awscloudformation;
      const stackName = stackInfo.StackName;

      // 3. Read cached template
      const templatePath = path.join(currentCloudBackendPath, 'awscloudformation', 'build', 'root-cloudformation-stack.json');

      if (!fs.existsSync(templatePath)) {
        return {
          hasTemplateDrift: false,
          hasRealDrift: false,
          changes: [],
          nestedStackQuirks: [],
          skipped: true,
          skipReason: 'No cached CloudFormation template found',
        };
      }

      const template = await fs.readJson(templatePath);

      // 4. Prepare parameters
      const parameters = this.extractParameters(stackInfo, template);

      // 5. Create changeset
      const changeSetName = `amplify-drift-detection-${Date.now()}`;

      await this.cfn.send(
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
      let changeSet;
      try {
        await waitUntilChangeSetCreateComplete(
          {
            client: this.cfn,
            maxWaitTime: 300,
          },
          {
            StackName: stackName,
            ChangeSetName: changeSetName,
          },
        );

        changeSet = await this.cfn.send(
          new DescribeChangeSetCommand({
            StackName: stackName,
            ChangeSetName: changeSetName,
          }),
        );
      } catch (waitError: any) {
        // If waiting fails, still try to get the changeset
        changeSet = await this.cfn.send(
          new DescribeChangeSetCommand({
            StackName: stackName,
            ChangeSetName: changeSetName,
          }),
        );
      }

      // Debug: Print full changeset in verbose mode
      if (this.context.parameters?.options?.verbose) {
        this.context.print.info(`CloudFormation ChangeSet: ${stackName}`);
        this.context.print.info(`Status: ${changeSet.Status}`);
        this.context.print.info(`IncludeNestedStacks: ${changeSet.IncludeNestedStacks}`);
        if (changeSet.StatusReason) {
          this.context.print.info(`StatusReason: ${changeSet.StatusReason}`);
        }
        if (changeSet.Changes && changeSet.Changes.length > 0) {
          this.context.print.info(`Changes: ${changeSet.Changes.length}`);
          for (const change of changeSet.Changes) {
            if (change.ResourceChange) {
              const rc = change.ResourceChange;
              this.context.print.info(`  ${rc.LogicalResourceId} (${rc.ResourceType}) - ${rc.Action}`);
            }
          }
        } else {
          this.context.print.info('Changes: 0');
        }
      }

      const result = await this.analyzeChangeSet(changeSet);

      // 8. Cleanup
      try {
        await this.cfn.send(
          new DeleteChangeSetCommand({
            StackName: stackName,
            ChangeSetName: changeSetName,
          }),
        );
      } catch (deleteError) {
        // Ignore cleanup errors
      }

      return result;
    } catch (error: any) {
      return {
        hasTemplateDrift: false,
        hasRealDrift: false,
        changes: [],
        nestedStackQuirks: [],
        error: error.message,
      };
    }
  }

  private extractParameters(stackInfo: any, template: any): any[] {
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

  private async analyzeChangeSet(changeSet: any): Promise<TemplateDriftResult> {
    const result: TemplateDriftResult = {
      hasTemplateDrift: false,
      hasRealDrift: false,
      changes: [],
      nestedStackQuirks: [],
    };

    // Handle "No updates" case
    if (changeSet.Status === 'FAILED' && changeSet.StatusReason?.includes('No updates')) {
      return result;
    }

    if (!changeSet.Changes || changeSet.Changes.length === 0) {
      return result;
    }

    result.hasTemplateDrift = true;

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
        isRealChange: true,
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

          if (this.context.parameters?.options?.verbose) {
            this.context.print.info(`Fetching nested changeset: ${stackName}`);
            this.context.print.info(`ChangeSet: ${changeSetName}`);
          }

          // Describe the nested changeset
          const nestedChangeSet = await this.cfn.send(
            new DescribeChangeSetCommand({
              StackName: stackName,
              ChangeSetName: changeSetName,
            }),
          );

          // Print nested changeset details in verbose mode
          if (this.context.parameters?.options?.verbose && nestedChangeSet.Changes && nestedChangeSet.Changes.length > 0) {
            this.context.print.info(`Nested Stack: ${stackName}`);
            this.context.print.info(`Nested Changes: ${nestedChangeSet.Changes.length}`);
            for (const nestedChange of nestedChangeSet.Changes) {
              if (nestedChange.ResourceChange) {
                const nrc = nestedChange.ResourceChange;
                this.context.print.info(`  ${nrc.LogicalResourceId} (${nrc.ResourceType}) - ${nrc.Action}`);
                if (nrc.ResourceType === 'AWS::CloudFormation::Stack' && nrc.ChangeSetId) {
                  this.context.print.info(`    Has nested changeset (3rd level or deeper)`);
                }
              }
            }
          }

          // Recursively analyze nested changeset
          const nestedResult = await this.analyzeChangeSet(nestedChangeSet);

          // Add nested changes to the current change
          if (nestedResult.changes && nestedResult.changes.length > 0) {
            changeInfo.nestedChanges = nestedResult.changes;
            if (this.context.parameters?.options?.verbose) {
              this.context.print.info(`Processed ${nestedResult.changes.length} nested changes`);
            }
          }
        } catch (error: any) {
          // Log error but continue processing
          if (this.context.parameters?.options?.verbose) {
            this.context.print.warning(`Could not fetch nested changeset: ${error.message}`);
            this.context.print.warning(`Stack ARN: ${rc.PhysicalResourceId}`);
            this.context.print.warning(`ChangeSet ID: ${rc.ChangeSetId}`);
          }
        }
      }

      // With IncludeNestedStacks: true, we don't get false positives
      // All changes are real changes
      result.hasRealDrift = true;

      result.changes.push(changeInfo);
    }

    return result;
  }

  // No longer needed - IncludeNestedStacks: true prevents false positives
}
