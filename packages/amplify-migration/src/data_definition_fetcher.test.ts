import assert from 'node:assert';
import { BackendEnvironment } from '@aws-sdk/client-amplify';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { DataDefinitionFetcher } from './data_definition_fetcher';
import { AmplifyStackParser, AmplifyStacks } from './amplify_stack_parser';
import { Stack } from '@aws-sdk/client-cloudformation';
import { stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';

import fs from 'fs-extra';
import glob from 'glob';

jest.mock('fs-extra');
jest.mock('glob');
jest.mock('@aws-amplify/amplify-cli-core');

describe('DataDefinitionFetcher', () => {
  let dataDefinitionFetcher: DataDefinitionFetcher;
  let backendEnvironmentResolver: BackendEnvironmentResolver;
  let amplifyStackParser: AmplifyStackParser;

  beforeEach(() => {
    backendEnvironmentResolver = new BackendEnvironmentResolver('mockAppId', {} as any);
    amplifyStackParser = new AmplifyStackParser({} as any);
    dataDefinitionFetcher = new DataDefinitionFetcher(backendEnvironmentResolver, amplifyStackParser);

    (stateManager.getMeta as jest.Mock).mockReturnValue({
      api: {
        mockResource: {
          service: 'AppSync',
        },
      },
    });

    (pathManager.findProjectRoot as jest.Mock).mockReturnValue('/mock/root/dir');

    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      return filePath.includes('schema');
    });
    (fs.statSync as jest.Mock).mockImplementation((filePath: string) => {
      return {
        isDirectory: () => filePath.includes('schema'),
      };
    });

    (glob.sync as jest.Mock).mockImplementation((pattern: string) => {
      if (pattern.includes('schema')) {
        return [
          path.join('/mock/root/dir/amplify/backend/api/mockResource/schema/schema1.graphql'),
          path.join('/mock/root/dir/amplify/backend/api/mockResource/schema/schema2.graphql'),
        ];
      }
      return [];
    });

    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.includes('schema1.graphql')) {
        return 'type Query { getSchema1: String }';
      }
      if (filePath.includes('schema2.graphql')) {
        return 'type Mutation { updateSchema2: String }';
      }
      return 'type Query { getSchema: String }';
    });
  });

  describe('if data stack is defined', () => {
    describe('table mapping is defined', () => {
      it('maps cloudformation stack output to table mapping', async () => {
        const mapping = { hello: 'world' };
        const mockBackendEnvResolver: BackendEnvironmentResolver = {
          getAllBackendEnvironments: async () => {
            return [
              {
                environmentName: 'dev',
                stackName: 'asdf',
              },
            ] as BackendEnvironment[];
          },
        } as BackendEnvironmentResolver;
        const mockAmplifyStackParser: AmplifyStackParser = {
          getAmplifyStacks: async () =>
            ({
              dataStack: {
                Outputs: [
                  {
                    OutputKey: 'DataSourceMappingOutput',
                    OutputValue: JSON.stringify(mapping),
                  },
                ],
              } as unknown as Stack,
            } as AmplifyStacks),
        } as unknown as AmplifyStackParser;
        const dataDefinitionFetcher = new DataDefinitionFetcher(mockBackendEnvResolver, mockAmplifyStackParser);
        const results = await dataDefinitionFetcher.getDefinition();
        assert(results?.tableMappings);
      });
      it('return undefined for mapping if json cannot be parsed', async () => {
        const mockBackendEnvResolver: BackendEnvironmentResolver = {
          getAllBackendEnvironments: async () => {
            return [
              {
                environmentName: 'dev',
                stackName: 'asdf',
              },
            ] as BackendEnvironment[];
          },
        } as BackendEnvironmentResolver;
        const mockAmplifyStackParser: AmplifyStackParser = {
          getAmplifyStacks: async () =>
            ({
              dataStack: {
                Outputs: [
                  {
                    OutputKey: 'DataSourceMappingOutput',
                    OutputValue: '(}',
                  },
                ],
              } as unknown as Stack,
            } as AmplifyStacks),
        } as unknown as AmplifyStackParser;
        const dataDefinitionFetcher = new DataDefinitionFetcher(mockBackendEnvResolver, mockAmplifyStackParser);
        const results = await dataDefinitionFetcher.getDefinition();
        assert(results?.tableMappings);
        assert.equal(JSON.stringify(results?.tableMappings), JSON.stringify({ dev: undefined }));
      });
    });
    describe('table mapping is not defined', () => {
      it('return undefined for table mapping', async () => {
        const mockBackendEnvResolver: BackendEnvironmentResolver = {
          getAllBackendEnvironments: async () => {
            return [
              {
                environmentName: 'dev',
                stackName: 'asdf',
              },
            ] as BackendEnvironment[];
          },
        } as BackendEnvironmentResolver;
        const mockAmplifyStackParser: AmplifyStackParser = {
          getAmplifyStacks: async () =>
            ({
              dataStack: {},
            } as AmplifyStacks),
        } as unknown as AmplifyStackParser;
        const dataDefinitionFetcher = new DataDefinitionFetcher(mockBackendEnvResolver, mockAmplifyStackParser);
        const results = await dataDefinitionFetcher.getDefinition();
        assert(results?.tableMappings);
        assert.equal(JSON.stringify(results?.tableMappings), JSON.stringify({ dev: undefined }));
      });
    });
  });
  describe('if data stack is undefined', () => {
    it('does not reject with table mapping assertion', async () => {
      const mockBackendEnvResolver: BackendEnvironmentResolver = {
        getAllBackendEnvironments: async () => {
          return [
            {
              environmentName: 'dev',
              stackName: 'asdf',
            },
          ] as BackendEnvironment[];
        },
      } as BackendEnvironmentResolver;
      const mockAmplifyStackParser: AmplifyStackParser = {
        getAmplifyStacks: async () =>
          ({
            dataStack: undefined,
          } as AmplifyStacks),
      } as unknown as AmplifyStackParser;
      const dataDefinitionFetcher = new DataDefinitionFetcher(mockBackendEnvResolver, mockAmplifyStackParser);
      await assert.doesNotReject(dataDefinitionFetcher.getDefinition);
    });
    it('returns undefined for table mapping', async () => {
      const mockBackendEnvResolver: BackendEnvironmentResolver = {
        getAllBackendEnvironments: async () => {
          return [
            {
              environmentName: 'dev',
              stackName: 'asdf',
            },
          ] as BackendEnvironment[];
        },
      } as BackendEnvironmentResolver;
      const mockAmplifyStackParser: AmplifyStackParser = {
        getAmplifyStacks: async () =>
          ({
            dataStack: undefined,
          } as AmplifyStacks),
      } as unknown as AmplifyStackParser;
      const dataDefinitionFetcher = new DataDefinitionFetcher(mockBackendEnvResolver, mockAmplifyStackParser);
      const results = await dataDefinitionFetcher.getDefinition();
      assert(results?.tableMappings);
      assert.equal(JSON.stringify(results?.tableMappings), JSON.stringify({ dev: undefined }));
    });
  });

  it('should return merged schema from schema folder', async () => {
    const schema = await dataDefinitionFetcher.getSchema();
    expect(schema).toContain('type Query { getSchema1: String }');
    expect(schema).toContain('type Mutation { updateSchema2: String }');
  });

  describe('when only schema.graphql exists', () => {
    it('should return the content of schema.graphql', async () => {
      (fs.statSync as jest.Mock).mockImplementation(() => {
        return {
          isDirectory: () => false,
        };
      });
      const schema = await dataDefinitionFetcher.getSchema();
      expect(schema).toBe('type Query { getSchema: String }');
    });
  });

  describe('when no schema exists', () => {
    it('should throw error when no schema is found', async () => {
      (fs.existsSync as jest.Mock).mockImplementation(() => {
        return false;
      });

      await expect(dataDefinitionFetcher.getSchema()).rejects.toThrow('No GraphQL schema found in the project');
    });
  });

  describe('error handling', () => {
    it('should throw error when file reading fails', async () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(dataDefinitionFetcher.getSchema()).rejects.toThrow('Error reading GraphQL schema: Permission denied');
    });
  });
});
