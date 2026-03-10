/**
 * Detect local drift (Phase 3) - Local files vs S3 backend
 * Note: S3 sync is handled separately before all phases run
 */

import { $TSContext, pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import fs from 'fs-extra';

/**
 * Local drift detection results (Phase 3)
 */
export interface LocalDriftResults {
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
  service: string;
  providerPlugin?: string;
  dependsOn?: Array<any>;
}

function isValidResourceInfo(resource: any): resource is ResourceInfo {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    typeof resource.category === 'string' &&
    typeof resource.resourceName === 'string' &&
    typeof resource.service === 'string' &&
    (resource.providerPlugin === undefined || typeof resource.providerPlugin === 'string') &&
    (resource.dependsOn === undefined || Array.isArray(resource.dependsOn))
  );
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
export async function detectLocalDrift(context: $TSContext): Promise<LocalDriftResults> {
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
    if (!currentCloudBackendDir || !fs.existsSync(currentCloudBackendDir)) {
      return {
        totalDrifted: 0,
        skipped: true,
        skipReason: 'No cloud backend found - project may not be deployed yet',
      };
    }

    // Lazy require — resource-status-data transitively imports amplify-provider-awscloudformation
    // which has top-level side effects (FeatureFlags.getNumber) that crash in test environments.
    // This is the established pattern in this codebase (see amplify-toolkit.ts).
    const { getResourceStatus } = require('../../extensions/amplify-helpers/resource-status-data');
    const statusResults = await getResourceStatus();

    const resourcesToBeCreated = statusResults.resourcesToBeCreated.filter(isValidResourceInfo);
    const resourcesToBeUpdated = statusResults.resourcesToBeUpdated.filter(isValidResourceInfo);
    const resourcesToBeDeleted = statusResults.resourcesToBeDeleted.filter(isValidResourceInfo);
    const resourcesToBeSynced = statusResults.resourcesToBeSynced.filter(isValidResourceInfo);

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
