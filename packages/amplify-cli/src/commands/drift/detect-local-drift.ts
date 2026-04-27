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
  readonly resourcesToBeCreated?: Array<ResourceInfo>;
  readonly resourcesToBeUpdated?: Array<ResourceInfo>;
  readonly resourcesToBeDeleted?: Array<ResourceInfo>;
  readonly skipped: boolean;
  readonly skipReason?: string;
}

/**
 * Resource information for Phase 3
 */
export interface ResourceInfo {
  readonly category: string;
  readonly resourceName: string;
  readonly service: string;
  readonly providerPlugin?: string;
  readonly dependsOn?: Array<any>;
}

function assertValidResourceInfo(resource: any): asserts resource is ResourceInfo {
  if (
    typeof resource !== 'object' ||
    resource === null ||
    typeof resource.category !== 'string' ||
    typeof resource.resourceName !== 'string' ||
    typeof resource.service !== 'string' ||
    (resource.providerPlugin !== undefined && typeof resource.providerPlugin !== 'string') ||
    (resource.dependsOn !== undefined && !Array.isArray(resource.dependsOn))
  ) {
    throw new Error(`Invalid ResourceInfo: ${JSON.stringify(resource)}`);
  }
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
        skipped: true,
        skipReason: 'Project not initialized',
      };
    }

    // Check if we have a cloud backend to compare against
    const currentCloudBackendDir = pathManager.getCurrentCloudBackendDirPath();
    if (!currentCloudBackendDir || !fs.existsSync(currentCloudBackendDir)) {
      return {
        skipped: true,
        skipReason: 'No cloud backend found - project may not be deployed yet',
      };
    }

    // Lazy require — resource-status-data transitively imports amplify-provider-awscloudformation
    // which has top-level side effects (FeatureFlags.getNumber) that crash in test environments.
    // This is the established pattern in this codebase (see amplify-toolkit.ts).
    const { getResourceStatus } = require('../../extensions/amplify-helpers/resource-status-data');
    const statusResults = await getResourceStatus();

    // resourcesToBeCreated/Updated/Deleted track managed (CloudFormation-backed)
    // resources with pending deployment changes. resourcesToBeSynced is excluded —
    // it tracks imported-resource lifecycle (import/unlink/refresh) which does not
    // involve CloudFormation stack operations.
    const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted } = statusResults;
    for (const arr of [resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted]) {
      arr.forEach(assertValidResourceInfo);
    }

    return {
      resourcesToBeCreated,
      resourcesToBeUpdated,
      resourcesToBeDeleted,
      skipped: false,
    };
  } catch (error: any) {
    // Handle errors gracefully
    return {
      skipped: true,
      skipReason: error.message || 'Unable to detect local drift',
    };
  }
}
