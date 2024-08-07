import assert from 'node:assert';
import { BackendEnvironment } from '@aws-sdk/client-amplify';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { DataDefinitionFetcher } from './data_definition_fetcher';
import { AmplifyStackParser, AmplifyStacks } from './amplify_stack_parser';
import { Stack } from '@aws-sdk/client-cloudformation';

describe('DataDefinitionFetcher', () => {
  describe('if data stack is defined', () => {
    describe('table mapping is defined', () => {
      it('maps cloudformation stack output to table mapping', async () => {
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
      it('throws an error if the json cannot be parsed', async () => {
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
    describe('table mapping is not defined', () => {
      it('reject with table mapping assertion', async () => {
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
  describe('if data stack is undefined', () => {
    it('does not reject with table mapping assertion', async () => {
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
    it('returns undefined', async () => {
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
