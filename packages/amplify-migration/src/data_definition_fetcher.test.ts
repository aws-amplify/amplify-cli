import assert from 'node:assert';
import { BackendEnvironment } from '@aws-sdk/client-amplify';
import { BackendEnvironmentResolver } from './backend_environment_selector.js';
import { DataDefinitionFetcher } from './data_definition_fetcher.js';
import { AmplifyStackParser, AmplifyStacks } from './amplify_stack_parser.js';
import { Stack } from '@aws-sdk/client-cloudformation';
import { describe, it } from 'node:test';

void describe('DataDefinitionFetcher', () => {
  void describe('if data stack is defined', () => {
    void describe('table mapping is defined', () => {
      void it('maps cloudformation stack output to table mapping', async () => {
        const mapping = { hello: 'world' };
        const mockBackendEnvResolver: BackendEnvironmentResolver = {
          selectBackendEnvironment: async () => {
            return {
              stackName: 'asdf',
            } as BackendEnvironment;
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
        assert(results?.tableMapping);
      });
      void it('throws an error if the json cannot be parsed', async () => {
        const mockBackendEnvResolver: BackendEnvironmentResolver = {
          selectBackendEnvironment: async () => {
            return {
              stackName: 'asdf',
            } as BackendEnvironment;
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
        await assert.rejects(() => dataDefinitionFetcher.getDefinition(), { message: 'Could not parse the Amplify Data table mapping' });
      });
    });
    void describe('table mapping is not defined', () => {
      void it('reject with table mapping assertion', async () => {
        const mockBackendEnvResolver: BackendEnvironmentResolver = {
          selectBackendEnvironment: async () => {
            return {
              stackName: 'asdf',
            } as BackendEnvironment;
          },
        } as BackendEnvironmentResolver;
        const mockAmplifyStackParser: AmplifyStackParser = {
          getAmplifyStacks: async () =>
            ({
              dataStack: {},
            } as AmplifyStacks),
        } as unknown as AmplifyStackParser;
        const dataDefinitionFetcher = new DataDefinitionFetcher(mockBackendEnvResolver, mockAmplifyStackParser);
        await assert.rejects(dataDefinitionFetcher.getDefinition);
      });
    });
  });
  void describe('if data stack is undefined', () => {
    void it('does not reject with table mapping assertion', async () => {
      const mockBackendEnvResolver: BackendEnvironmentResolver = {
        selectBackendEnvironment: async () => {
          return {
            stackName: 'asdf',
          } as BackendEnvironment;
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
    void it('returns undefined', async () => {
      const mockBackendEnvResolver: BackendEnvironmentResolver = {
        selectBackendEnvironment: async () => {
          return {
            stackName: 'asdf',
          } as BackendEnvironment;
        },
      } as BackendEnvironmentResolver;
      const mockAmplifyStackParser: AmplifyStackParser = {
        getAmplifyStacks: async () =>
          ({
            dataStack: undefined,
          } as AmplifyStacks),
      } as unknown as AmplifyStackParser;
      const dataDefinitionFetcher = new DataDefinitionFetcher(mockBackendEnvResolver, mockAmplifyStackParser);
      const definition = await dataDefinitionFetcher.getDefinition();
      assert.equal(definition, undefined);
    });
  });
});
