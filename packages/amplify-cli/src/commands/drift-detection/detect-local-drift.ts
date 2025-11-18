/**
 * Detect local drift (Phase 3) - Local files vs S3 backend
 * Fetches fresh state from S3 before comparison
 */

import { $TSContext, AmplifyError, pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { downloadZip, extractZip } from '@aws-amplify/amplify-provider-awscloudformation/lib/zip-util';
import { S3 } from '@aws-amplify/amplify-provider-awscloudformation/lib/aws-utils/aws-s3';
const { S3BackendZipFileName } = require('@aws-amplify/amplify-provider-awscloudformation/lib/constants');

/**
 * Phase 3 drift detection results
 */
export interface Phase3Results {
  phase: 3;
  hasDrift: boolean;
  totalDrifted?: number;
  resourcesToBeCreated?: Array<ResourceInfo>;
  resourcesToBeUpdated?: Array<ResourceInfo>;
  resourcesToBeDeleted?: Array<ResourceInfo>;
  resourcesToBeSynced?: Array<ResourceInfo>;
  tagsUpdated?: boolean;
  rootStackUpdated?: boolean;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Resource information for Phase 3
 */
export interface ResourceInfo {
  category: string;
  resourceName: string;
  service?: string;
  providerPlugin?: string;
  dependsOn?: Array<any>;
}

/**
 * Detect drift between local files and S3 backend state
 * This is Phase 3 of drift detection - compares against LIVE S3 state
 * Fix #2: Accept context as parameter for proper S3 initialization
 */
export async function detectLocalDrift(context: $TSContext): Promise<Phase3Results> {
  try {
    // Check if project is initialized first
    if (!stateManager.metaFileExists()) {
      return {
        phase: 3,
        hasDrift: false,
        skipped: true,
        skipReason: 'Project not initialized',
      };
    }

    // Refresh the cloud backend cache from S3 to get current state
    await refreshCloudBackendFromS3(context);

    // Now use existing status logic with fresh data from S3
    const { getResourceStatus } = require('../../extensions/amplify-helpers/resource-status-data');

    const statusResults = await getResourceStatus();

    const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeSynced, tagsUpdated, rootStackUpdated } =
      statusResults;

    // Calculate total drift
    const totalDrifted = resourcesToBeCreated.length + resourcesToBeUpdated.length + resourcesToBeDeleted.length;

    const hasDrift = totalDrifted > 0 || tagsUpdated || rootStackUpdated;

    return {
      phase: 3,
      hasDrift,
      totalDrifted,
      resourcesToBeCreated,
      resourcesToBeUpdated,
      resourcesToBeDeleted,
      resourcesToBeSynced,
      tagsUpdated,
      rootStackUpdated,
    };
  } catch (error: any) {
    // Handle errors gracefully
    return {
      phase: 3,
      hasDrift: false,
      skipped: true,
      skipReason: error.message || 'Unable to detect local drift',
    };
  }
}

/**
 * Refresh the #current-cloud-backend directory with fresh data from S3
 * This ensures we're comparing against the actual deployed state, not stale cache
 * Uses the same ZIP-based approach as the existing Amplify code for consistency
 */
async function refreshCloudBackendFromS3(context: $TSContext): Promise<void> {
  const amplifyDir = pathManager.getAmplifyDirPath();
  const tempDir = path.join(amplifyDir, '.temp');
  const currentCloudBackendDir = pathManager.getCurrentCloudBackendDirPath();

  const s3 = await S3.getInstance(context);
  let currentCloudBackendZip: string;
  try {
    currentCloudBackendZip = await downloadZip(s3, tempDir, S3BackendZipFileName, undefined);
  } catch (err: any) {
    if (err?.name === 'NoSuchBucket') {
      throw new AmplifyError('EnvironmentNotInitializedError', {
        message: `Could not find a deployment bucket for the specified backend environment. This environment may have been deleted.`,
        resolution: 'Make sure the environment has been initialized with "amplify init" or "amplify env add".',
      });
    }
    // if there was some other error, wrap it in AmplifyError
    throw new AmplifyError(
      'DeploymentError',
      {
        message: `Failed to download backend state from S3: ${err.message}`,
        resolution: 'Check your AWS credentials and network connection.',
      },
      err,
    );
  }

  const unzippedDir = await extractZip(tempDir, currentCloudBackendZip);
  const newDir = `${currentCloudBackendDir}.new`;

  fs.copySync(unzippedDir, newDir);
  fs.removeSync(currentCloudBackendDir);
  fs.moveSync(newDir, currentCloudBackendDir);

  fs.removeSync(tempDir);
}
