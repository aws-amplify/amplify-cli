/**
 * Detect local drift (Phase 3) - Local files vs S3 backend
 * Note: S3 sync is handled separately before all phases run
 */

import { $TSContext, pathManager, stateManager } from '@aws-amplify/amplify-cli-core';

/**
 * Phase 3 drift detection results
 */
export interface Phase3Results {
  totalDrifted: number;
  resourcesToBeCreated?: Array<ResourceInfo>;
  resourcesToBeUpdated?: Array<ResourceInfo>;
  resourcesToBeDeleted?: Array<ResourceInfo>;
  resourcesToBeSynced?: Array<ResourceInfo>;
  skipped: boolean;
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
 * This is Phase 3 of drift detection - compares local against cloud backend
 *
 * IMPORTANT: This function now assumes the #current-cloud-backend directory
 * has already been synced from S3. The sync is handled separately in
 * syncCloudBackendFromS3() which is called before all phases run.
 *
 * @param context - Amplify context (kept for consistency, not used after refactor)
 */
export async function detectLocalDrift(context: $TSContext): Promise<Phase3Results> {
  try {
    // Check if project is initialized first
    if (!stateManager.metaFileExists()) {
      return {
        totalDrifted: 0,
        skipped: true,
        skipReason: 'Project not initialized',
      };
    }

    // Check if we have a cloud backend to compare against
    const currentCloudBackendDir = pathManager.getCurrentCloudBackendDirPath();
    if (!currentCloudBackendDir || !require('fs-extra').existsSync(currentCloudBackendDir)) {
      return {
        totalDrifted: 0,
        skipped: true,
        skipReason: 'No cloud backend found - project may not be deployed yet',
      };
    }

    // Use existing status logic to compare local vs cloud backend
    // Note: The cloud backend has already been synced from S3
    const { getResourceStatus } = require('../../extensions/amplify-helpers/resource-status-data');

    const statusResults = await getResourceStatus();

    const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeSynced } = statusResults;

    // Calculate total drift
    const totalDrifted = resourcesToBeCreated.length + resourcesToBeUpdated.length + resourcesToBeDeleted.length;

    return {
      totalDrifted,
      resourcesToBeCreated,
      resourcesToBeUpdated,
      resourcesToBeDeleted,
      resourcesToBeSynced,
      skipped: false,
    };
  } catch (error: any) {
    // Handle errors gracefully
    return {
      totalDrifted: 0,
      skipped: true,
      skipReason: error.message || 'Unable to detect local drift',
    };
  }
}
