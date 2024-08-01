import assert from 'node:assert';
import { BackendEnvironment } from '@aws-sdk/client-amplify';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { DataDefinitionFetcher } from './data_definition_fetcher';
import { AmplifyStackParser, AmplifyStacks } from './amplify_stack_parser';
import { Stack } from '@aws-sdk/client-cloudformation';

describe('DataDefinitionFetcher', () => {
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
