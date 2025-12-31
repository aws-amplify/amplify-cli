/**
 * CloudFormation service for AWS operations
 * Handles all CloudFormation API interactions and S3 backend sync
 */

import { CloudFormationClient, GetTemplateCommand } from '@aws-sdk/client-cloudformation';
import type { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AmplifyError, pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import type { CloudFormationTemplate } from './drift-formatter';
import type { Print } from '../../drift';

// Import the CloudFormation class from the provider
const CloudFormation = require('@aws-amplify/amplify-provider-awscloudformation/lib/aws-utils/aws-cfn');

// Import S3 utilities for backend sync
import { downloadZip, extractZip } from '@aws-amplify/amplify-provider-awscloudformation/lib/zip-util';
import { S3 } from '@aws-amplify/amplify-provider-awscloudformation/lib/aws-utils/aws-s3';
const { S3BackendZipFileName } = require('@aws-amplify/amplify-provider-awscloudformation/lib/constants');

/**
 * Service for CloudFormation operations
 */
export class CloudFormationService {
  constructor(private readonly print: Print) {}
  /**
   * Get CloudFormation client
   * Uses the standard Amplify CloudFormation class for proper configuration
   */
  public async getClient(context: $TSContext): Promise<CloudFormationClient> {
    const cfn = await new CloudFormation(context, 'drift:detect');
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
        'StackNotFoundError',
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

  /**
   * Sync the #current-cloud-backend directory with fresh data from S3
   * This ensures all drift detection phases work with the actual deployed state
   *
   * @param context - Amplify context for AWS operations
   * @returns Promise<boolean> - true if sync succeeded, false if skipped/failed
   */
  public async syncCloudBackendFromS3(context: $TSContext): Promise<boolean> {
    try {
      // Check if project is initialized
      if (!stateManager.metaFileExists()) {
        this.print.debug('Skipping S3 sync: Project not initialized');
        return false;
      }

      const amplifyDir = pathManager.getAmplifyDirPath();
      const tempDir = path.join(amplifyDir, '.temp');
      const currentCloudBackendDir = pathManager.getCurrentCloudBackendDirPath();

      // Check if we have a cloud backend to sync
      if (!fs.existsSync(currentCloudBackendDir)) {
        this.print.debug('Skipping S3 sync: No cloud backend directory found');
        return false;
      }

      const s3 = await S3.getInstance(context);
      let currentCloudBackendZip: string;

      try {
        // Download the latest backend state from S3
        currentCloudBackendZip = await downloadZip(s3, tempDir, S3BackendZipFileName, undefined);
      } catch (err: any) {
        if (err?.name === 'NoSuchBucket') {
          // Environment not deployed yet, nothing to sync
          this.print.debug('Skipping S3 sync: No deployment bucket found');
          return false;
        }
        // Log other errors but don't fail the entire drift detection
        this.print.warn(`Warning: Could not sync from S3: ${err.message}`);
        return false;
      }

      // Extract and replace the current cloud backend
      const unzippedDir = await extractZip(tempDir, currentCloudBackendZip);
      await fs.remove(currentCloudBackendDir);
      await fs.move(unzippedDir, currentCloudBackendDir);
      await fs.remove(tempDir);

      return true;
    } catch (error: any) {
      // Log but don't fail - phases can still run with existing cache
      this.print.warn(`Warning: S3 sync failed: ${error.message}`);
      return false;
    }
  }
}
