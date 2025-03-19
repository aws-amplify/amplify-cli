import assert from 'node:assert';
import { BackendEnvironment } from '@aws-sdk/client-amplify';
import { Stack } from '@aws-sdk/client-cloudformation';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { DataDefinitionFetcher } from './data_definition_fetcher';
import { AmplifyStackParser, AmplifyStacks } from './amplify_stack_parser';
import { BackendDownloader } from './backend_downloader';
import { fileOrDirectoryExists } from './directory_exists';
import { pathManager } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';
import fs from 'node:fs/promises';
import glob from 'glob';

jest.mock('node:fs/promises');
jest.mock('glob');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('./directory_exists');

// Test constants
const MOCK_ROOT_DIR = '/mock/root/dir';
const MOCK_CLOUD_BACKEND = '/mock/cloud/backend';
const MOCK_APP_ID = 'mockAppId';

// Type definitions
interface MockBackendEnvironment extends BackendEnvironmentResolver {
  getAllBackendEnvironments: () => Promise<BackendEnvironment[]>;
  selectBackendEnvironment: () => Promise<BackendEnvironment>;
}

// Test helpers
const createMockBackendResolver = (environmentName = 'dev'): MockBackendEnvironment =>
  ({
    getAllBackendEnvironments: async () =>
      [
        {
          environmentName,
          stackName: 'asdf',
        },
      ] as BackendEnvironment[],
    selectBackendEnvironment: async () =>
      ({
        environmentName,
        stackName: 'asdf',
        deploymentArtifacts: 'asdf',
      } as BackendEnvironment),
  } as MockBackendEnvironment);

const createMockAmplifyStackParser = (stackData: Partial<Stack> = {}): AmplifyStackParser =>
  ({
    getAmplifyStacks: async () =>
      ({
        dataStack: stackData as Stack,
      } as AmplifyStacks),
  } as unknown as AmplifyStackParser);

describe('DataDefinitionFetcher', () => {
  let dataDefinitionFetcher: DataDefinitionFetcher;
  let backendEnvironmentResolver: BackendEnvironmentResolver;
  let amplifyStackParser: AmplifyStackParser;
  let ccbFetcher: BackendDownloader;
  let mockAmplifyMeta: Record<string, any>;

  beforeEach(() => {
    // Setup basic mocks
    backendEnvironmentResolver = new BackendEnvironmentResolver(MOCK_APP_ID, {} as any);
    amplifyStackParser = new AmplifyStackParser({} as any);
    ccbFetcher = {
      getCurrentCloudBackend: jest.fn().mockResolvedValue(MOCK_CLOUD_BACKEND),
    } as unknown as BackendDownloader;

    // Initialize fetcher
    dataDefinitionFetcher = new DataDefinitionFetcher(backendEnvironmentResolver, ccbFetcher, amplifyStackParser);

    // Setup mock data
    mockAmplifyMeta = {
      api: {
        mockResource: {
          service: 'AppSync',
        },
      },
    };

    // Setup common mocks
    (pathManager.findProjectRoot as jest.Mock).mockReturnValue(MOCK_ROOT_DIR);
    (fileOrDirectoryExists as jest.Mock).mockResolvedValue(true);

    // Setup file system mocks
    setupFileSystemMocks();
  });

  const setupFileSystemMocks = () => {
    (fs.stat as jest.Mock).mockImplementation((filePath: string) => ({
      isDirectory: () => filePath.includes('schema'),
    }));

    (glob.sync as jest.Mock).mockImplementation((pattern: string) =>
      pattern.includes('schema')
        ? [
            path.join(MOCK_ROOT_DIR, 'amplify/backend/api/mockResource/schema/schema1.graphql'),
            path.join(MOCK_ROOT_DIR, 'amplify/backend/api/mockResource/schema/schema2.graphql'),
          ]
        : [],
    );

    (fs.readFile as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.includes('amplify-meta.json')) {
        return JSON.stringify(mockAmplifyMeta);
      }
      if (filePath.includes('schema1.graphql')) {
        return 'type Query { getSchema1: String }';
      }
      if (filePath.includes('schema2.graphql')) {
        return 'type Mutation { updateSchema2: String }';
      }
      return 'type Query { getSchema: String }';
    });
  };

  describe('Table Mapping Tests', () => {
    describe('with defined data stack', () => {
      it('should correctly map cloudformation stack output to table mapping', async () => {
        const mapping = { hello: 'world' };
        const mockResolver = createMockBackendResolver();
        const mockParser = createMockAmplifyStackParser({
          Outputs: [
            {
              OutputKey: 'DataSourceMappingOutput',
              OutputValue: JSON.stringify(mapping),
            },
          ],
        });

        const fetcher = new DataDefinitionFetcher(mockResolver, ccbFetcher, mockParser);
        const results = await fetcher.getDefinition();

        assert(results?.tableMappings);
      });

      it('should return undefined mapping when JSON parsing fails', async () => {
        const mockResolver = createMockBackendResolver();
        const mockParser = createMockAmplifyStackParser({
          Outputs: [
            {
              OutputKey: 'DataSourceMappingOutput',
              OutputValue: '(}', // Invalid JSON
            },
          ],
        });

        const fetcher = new DataDefinitionFetcher(mockResolver, ccbFetcher, mockParser);
        const results = await fetcher.getDefinition();

        assert(results?.tableMappings);
        assert.deepStrictEqual(results?.tableMappings, { dev: undefined });
      });
    });

    describe('table mapping is not defined', () => {
      it('return undefined for table mapping', async () => {
        const mockResolver = createMockBackendResolver();
        const mockParser = createMockAmplifyStackParser({});

        const fetcher = new DataDefinitionFetcher(mockResolver, ccbFetcher, mockParser);
        const results = await fetcher.getDefinition();
        assert(results?.tableMappings);
        assert.equal(JSON.stringify(results?.tableMappings), JSON.stringify({ dev: undefined }));
      });
    });

    describe('with undefined data stack', () => {
      it('should handle undefined data stack gracefully', async () => {
        const mockResolver = createMockBackendResolver();
        const mockParser = createMockAmplifyStackParser(undefined);

        const fetcher = new DataDefinitionFetcher(mockResolver, ccbFetcher, mockParser);
        await assert.doesNotReject(fetcher.getDefinition);
        const results = await fetcher.getDefinition();

        assert(results?.tableMappings);
        assert.deepStrictEqual(results?.tableMappings, { dev: undefined });
      });
    });
  });

  describe('Schema Tests', () => {
    it('should merge multiple schema files from schema folder', async () => {
      const schema = await dataDefinitionFetcher.getSchema({
        mockResource: { service: 'AppSync' },
      });

      expect(schema).toContain('type Query { getSchema1: String }');
      expect(schema).toContain('type Mutation { updateSchema2: String }');
    });

    it('should return single schema.graphql content when only it exists', async () => {
      (fs.stat as jest.Mock).mockImplementation(() => ({
        isDirectory: () => false,
      }));

      const schema = await dataDefinitionFetcher.getSchema({
        mockResource: { service: 'AppSync' },
      });

      expect(schema).toBe('type Query { getSchema: String }');
    });

    it('should throw error when no schema is found', async () => {
      (fs.stat as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(dataDefinitionFetcher.getSchema({ mockResource: { service: 'AppSync' } })).rejects.toThrow(
        'No GraphQL schema found in the project',
      );
    });
  });
});
