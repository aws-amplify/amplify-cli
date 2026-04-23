import type { ResourceInfo } from '../../../commands/drift-detection/detect-local-drift';

// Mock @aws-amplify/amplify-cli-core
const mockMetaFileExists = jest.fn();
const mockGetCurrentCloudBackendDirPath = jest.fn();
jest.mock('@aws-amplify/amplify-cli-core', () => ({
  stateManager: {
    metaFileExists: mockMetaFileExists,
  },
  pathManager: {
    getCurrentCloudBackendDirPath: mockGetCurrentCloudBackendDirPath,
  },
}));

// Mock fs-extra
const mockExistsSync = jest.fn();
jest.mock('fs-extra', () => ({
  existsSync: mockExistsSync,
}));

// Mock resource-status-data (lazy-required by detect-local-drift)
const mockGetResourceStatus = jest.fn();
jest.mock('../../../extensions/amplify-helpers/resource-status-data', () => ({
  getResourceStatus: mockGetResourceStatus,
}));

import { detectLocalDrift } from '../../../commands/drift-detection/detect-local-drift';

function makeResource(fields: { category: string; resourceName: string; service: string; providerPlugin?: string }): ResourceInfo {
  return { ...fields };
}

/**
 * Set up mocks so detectLocalDrift proceeds past early-exit checks.
 */
function setupHappyPath(): void {
  mockMetaFileExists.mockReturnValue(true);
  mockGetCurrentCloudBackendDirPath.mockReturnValue('/mock/current-cloud-backend');
  mockExistsSync.mockReturnValue(true);
}

/**
 * Configure getResourceStatus to return the given arrays.
 */
function mockResourceStatusArrays(
  resourcesToBeCreated: ResourceInfo[] = [],
  resourcesToBeUpdated: ResourceInfo[] = [],
  resourcesToBeDeleted: ResourceInfo[] = [],
  resourcesToBeSynced: ResourceInfo[] = [],
): void {
  mockGetResourceStatus.mockResolvedValue({
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeDeleted,
    resourcesToBeSynced,
  });
}

// detectLocalDrift accepts a context parameter but does not use it after refactor
const mockContext = {} as any;

describe('detectLocalDrift', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupHappyPath();
  });

  describe('resourcesToBeSynced exclusion (ADR-006)', () => {
    it('does not include resourcesToBeSynced in results', async () => {
      const importedRefresh = {
        category: 'auth',
        resourceName: 'userPoolImported',
        service: 'Cognito',
        serviceType: 'imported',
        sync: 'refresh',
      };
      mockGetResourceStatus.mockResolvedValue({
        resourcesToBeCreated: [],
        resourcesToBeUpdated: [],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [importedRefresh],
      });

      const result = await detectLocalDrift(mockContext);

      expect(result.skipped).toBe(false);
      expect(result).not.toHaveProperty('resourcesToBeSynced');
    });

    it('does not include resourcesToBeSynced regardless of sync state', async () => {
      const syncImport = { category: 'auth', resourceName: 'pool', service: 'Cognito', serviceType: 'imported', sync: 'import' };
      const syncUnlink = { category: 'storage', resourceName: 's3', service: 'S3', serviceType: 'imported', sync: 'unlink' };
      const syncRefresh = { category: 'auth', resourceName: 'pool2', service: 'Cognito', serviceType: 'imported', sync: 'refresh' };
      mockGetResourceStatus.mockResolvedValue({
        resourcesToBeCreated: [],
        resourcesToBeUpdated: [],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [syncImport, syncUnlink, syncRefresh],
      });

      const result = await detectLocalDrift(mockContext);

      expect(result.skipped).toBe(false);
      expect(result).not.toHaveProperty('resourcesToBeSynced');
    });

    it('still returns resourcesToBeCreated, resourcesToBeUpdated, and resourcesToBeDeleted correctly', async () => {
      const created = makeResource({ category: 'api', resourceName: 'newApi', service: 'AppSync' });
      const updated = makeResource({ category: 'auth', resourceName: 'userPool', service: 'Cognito' });
      const deleted = makeResource({ category: 'storage', resourceName: 'oldBucket', service: 'S3' });
      mockResourceStatusArrays([created], [updated], [deleted], []);

      const result = await detectLocalDrift(mockContext);

      expect(result.skipped).toBe(false);
      expect(result.resourcesToBeCreated).toEqual([created]);
      expect(result.resourcesToBeUpdated).toEqual([updated]);
      expect(result.resourcesToBeDeleted).toEqual([deleted]);
      expect(result).not.toHaveProperty('resourcesToBeSynced');
    });

    it('returns empty arrays correctly when all arrays are empty', async () => {
      mockResourceStatusArrays([], [], [], []);

      const result = await detectLocalDrift(mockContext);

      expect(result.skipped).toBe(false);
      expect(result.resourcesToBeCreated).toEqual([]);
      expect(result.resourcesToBeUpdated).toEqual([]);
      expect(result.resourcesToBeDeleted).toEqual([]);
      expect(result).not.toHaveProperty('resourcesToBeSynced');
    });
  });

  describe('early exit conditions', () => {
    it('returns skipped when project is not initialized', async () => {
      mockMetaFileExists.mockReturnValue(false);

      const result = await detectLocalDrift(mockContext);

      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe('Project not initialized');
    });

    it('returns skipped when no cloud backend directory exists', async () => {
      mockGetCurrentCloudBackendDirPath.mockReturnValue('/mock/nonexistent');
      mockExistsSync.mockReturnValue(false);

      const result = await detectLocalDrift(mockContext);

      expect(result.skipped).toBe(true);
      expect(result.skipReason).toContain('No cloud backend found');
    });
  });

  describe('validation', () => {
    it('returns skipped on invalid resource info (non-string resourceName)', async () => {
      mockGetResourceStatus.mockResolvedValue({
        resourcesToBeCreated: [{ category: 'auth', resourceName: 123, service: 'Cognito' }],
        resourcesToBeUpdated: [],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [],
      });

      const result = await detectLocalDrift(mockContext);

      expect(result.skipped).toBe(true);
      expect(result.skipReason).toContain('Invalid ResourceInfo');
    });

    it('returns skipped on invalid resource info (non-string category)', async () => {
      mockGetResourceStatus.mockResolvedValue({
        resourcesToBeCreated: [],
        resourcesToBeUpdated: [{ category: 42, resourceName: 'pool', service: 'Cognito' }],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [],
      });

      const result = await detectLocalDrift(mockContext);

      expect(result.skipped).toBe(true);
      expect(result.skipReason).toContain('Invalid ResourceInfo');
    });
  });
});
