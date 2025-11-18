/**
 * CloudFormation service for AWS operations
 * Handles all CloudFormation API interactions
 */

import { CloudFormationClient, GetTemplateCommand } from '@aws-sdk/client-cloudformation';
import type { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import type { CloudFormationTemplate } from './drift-formatter';

// Import the CloudFormation class from the provider
const CloudFormation = require('@aws-amplify/amplify-provider-awscloudformation/lib/aws-utils/aws-cfn');

/**
 * Service for CloudFormation operations
 */
export class CloudFormationService {
  /**
   * Get CloudFormation client
   * Uses the standard Amplify CloudFormation class for proper configuration
   */
  public async getClient(context: $TSContext): Promise<CloudFormationClient> {
    // Use the standard Amplify CloudFormation class
    const cfn = await new CloudFormation(context, 'drift:detect');

    // Return the internal CloudFormationClient
    return cfn.cfn;
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
      throw new AmplifyError(
        'CloudFormationError',
        {
          message: `Failed to validate stack existence: ${error.message}`,
          resolution: 'Check your AWS credentials and permissions.',
        },
        error,
      );
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
