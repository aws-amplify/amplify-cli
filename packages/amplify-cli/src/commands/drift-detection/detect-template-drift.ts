import { $TSContext, stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
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
  private cfnService: CloudFormationService;

  constructor(context: $TSContext) {
    this.context = context;
    this.cfnService = new CloudFormationService();
    // Will be initialized in detect() method since it's async
  }

  async detect(): Promise<TemplateDriftResult> {
    try {
      // Initialize CloudFormation client using the standard Amplify pattern
      this.cfn = await this.cfnService.getClient(this.context);

      // 1. Check prerequisites
      const currentCloudBackendPath = pathManager.getCurrentCloudBackendDirPath();
      printer.debug(`Checking for #current-cloud-backend at: ${currentCloudBackendPath}`);
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
      printer.debug(`Environment: ${envName}, Stack: ${stackName}`);

      // 3. Read cached template
      const templatePath = path.join(currentCloudBackendPath, 'awscloudformation', 'build', 'root-cloudformation-stack.json');
      printer.debug(`Reading cached template from: ${templatePath}`);

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
      printer.debug(`Extracted ${parameters.length} parameters from template`);

      // 5. Create changeset
      const changeSetName = `amplify-drift-detection-${Date.now()}`;
      printer.debug(`Creating changeset: ${changeSetName}`);

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

      // Debug: Print full changeset
      printer.debug(`CloudFormation ChangeSet: ${stackName}`);
      printer.debug(`Status: ${changeSet.Status}`);
      printer.debug(`IncludeNestedStacks: ${changeSet.IncludeNestedStacks}`);
      if (changeSet.StatusReason) {
        printer.debug(`StatusReason: ${changeSet.StatusReason}`);
      }
      if (changeSet.Changes && changeSet.Changes.length > 0) {
        printer.debug(`Changes: ${changeSet.Changes.length}`);
        for (const change of changeSet.Changes) {
          if (change.ResourceChange) {
            const rc = change.ResourceChange;
            printer.debug(`  ${rc.LogicalResourceId} (${rc.ResourceType}) - ${rc.Action}`);
          }
        }
      } else {
        printer.debug('Changes: 0');
      }

      const result = await this.analyzeChangeSet(changeSet);

      // 8. Cleanup
      try {
        printer.debug(`Deleting changeset: ${changeSetName}`);
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
      printer.debug('ChangeSet status: No updates detected');
      return result;
    }

    if (!changeSet.Changes || changeSet.Changes.length === 0) {
      printer.debug('ChangeSet has no changes');
      return result;
    }

    result.hasTemplateDrift = true;
    printer.debug(`Analyzing ${changeSet.Changes.length} changes from changeset`);

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

          printer.debug(`Fetching nested changeset: ${stackName}`);
          printer.debug(`ChangeSet: ${changeSetName}`);

          // Describe the nested changeset
          const nestedChangeSet = await this.cfn.send(
            new DescribeChangeSetCommand({
              StackName: stackName,
              ChangeSetName: changeSetName,
            }),
          );

          // Print nested changeset details
          if (nestedChangeSet.Changes && nestedChangeSet.Changes.length > 0) {
            printer.debug(`Nested Stack: ${stackName}`);
            printer.debug(`Nested Changes: ${nestedChangeSet.Changes.length}`);
            for (const nestedChange of nestedChangeSet.Changes) {
              if (nestedChange.ResourceChange) {
                const nrc = nestedChange.ResourceChange;
                printer.debug(`  ${nrc.LogicalResourceId} (${nrc.ResourceType}) - ${nrc.Action}`);
                if (nrc.ResourceType === 'AWS::CloudFormation::Stack' && nrc.ChangeSetId) {
                  printer.debug(`    Has nested changeset (3rd level or deeper)`);
                }
              }
            }
          }

          // Recursively analyze nested changeset
          const nestedResult = await this.analyzeChangeSet(nestedChangeSet);

          // Add nested changes to the current change
          if (nestedResult.changes && nestedResult.changes.length > 0) {
            changeInfo.nestedChanges = nestedResult.changes;
            printer.debug(`Processed ${nestedResult.changes.length} nested changes`);
          }
        } catch (error: any) {
          // Log error but continue processing
          printer.debug(`Could not fetch nested changeset: ${error.message}`);
          printer.debug(`Stack ARN: ${rc.PhysicalResourceId}`);
          printer.debug(`ChangeSet ID: ${rc.ChangeSetId}`);
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
