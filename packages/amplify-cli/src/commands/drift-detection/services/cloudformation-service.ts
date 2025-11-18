/**
 * CloudFormation service for AWS operations
 * Handles all CloudFormation API interactions
 */

import { CloudFormationClient, GetTemplateCommand } from '@aws-sdk/client-cloudformation';
import type { $TSContext } from '@aws-amplify/amplify-cli-core';
import type { CloudFormationTemplate } from './drift-formatter';

/**
 * Service for CloudFormation operations
 */
export class CloudFormationService {
  /**
   * Get CloudFormation client
   * Creates a new client each time to ensure fresh credentials
   */
  public async getClient(context: $TSContext): Promise<CloudFormationClient> {
    // const { loadConfiguration } = require('@aws-amplify/amplify-provider-awscloudformation');
    // const credentials = await loadConfiguration(context);

    return new CloudFormationClient({
      // ...credentials,
      maxAttempts: 10,
    });
  }

  /**
   * Validate that a stack exists in CloudFormation
   */
  public async validateStackExists(client: CloudFormationClient, stackName: string): Promise<boolean> {
    try {
      await client.send(
        new GetTemplateCommand({
          StackName: stackName,
          TemplateStage: 'Original',
        }),
      );
      return true;
    } catch (error: any) {
      if (error.name === 'ValidationError' || error.message?.includes('does not exist')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get stack template from CloudFormation
   */
  public async getStackTemplate(client: CloudFormationClient, stackName: string): Promise<CloudFormationTemplate> {
    const response = await client.send(
      new GetTemplateCommand({
        StackName: stackName,
        TemplateStage: 'Original',
      }),
    );
    return JSON.parse(response.TemplateBody!);
  }
}
