import { mockClient } from 'aws-sdk-client-mock';
import {
  AmplifyUIBuilderClient,
  ExportComponentsCommand,
  CreateComponentCommand,
  GetMetadataCommand,
} from '@aws-sdk/client-amplifyuibuilder';
import * as extractArgsDependency from '../commands/utils/extractArgs';
import { run } from '../commands/cloneComponentsFromEnv';
import { isDataStoreEnabled } from '@aws-amplify/amplify-category-api';

const extractArgsDependencyMock = extractArgsDependency as any;
const amplifyUIBuilderMock = mockClient(AmplifyUIBuilderClient);

jest.mock('../commands/utils/featureFlags', () => ({
  getTransformerVersion: jest.fn().mockReturnValue(2),
}));
jest.mock('@aws-amplify/amplify-category-api', () => ({
  ...jest.requireActual('@aws-amplify/amplify-category-api'),
  isDataStoreEnabled: jest.fn(),
}));
jest.mock('../commands/utils/extractArgs');
jest.mock('@aws-amplify/amplify-cli-core');

const isDataStoreEnabledMocked = jest.mocked(isDataStoreEnabled);

describe('can clone components to new environment', () => {
  let context: any;
  beforeEach(() => {
    amplifyUIBuilderMock.reset();
    isDataStoreEnabledMocked.mockResolvedValue(true);
    context = {
      amplify: {
        invokePluginMethod: () => ({}),
      },
      input: {
        options: {
          appId: 'testAppId',
          envName: 'testEnvName',
        },
      },
    };
    extractArgsDependencyMock.extractArgs = jest.fn().mockReturnValue({
      sourceEnvName: 'sourceEnvName',
      newEnvName: 'newEnvName',
      appId: 'appId',
      environmentName: 'environmentName',
    });

    amplifyUIBuilderMock.on(ExportComponentsCommand).callsFake((input) => {
      if (input.environmentName === 'newEnvName') {
        return { entities: [] };
      }
      return { entities: [{}] };
    });
    amplifyUIBuilderMock.on(CreateComponentCommand).resolves({ entity: {} });
    amplifyUIBuilderMock.on(GetMetadataCommand).resolves({
      features: {
        autoGenerateForms: 'true',
        autoGenerateViews: 'true',
        formFeatureFlags: {
          isRelationshipSupported: 'false',
          isNonModelSupported: 'false',
        },
      },
    });
  });

  it('clones components to a new env', async () => {
    await run(context);
    expect(amplifyUIBuilderMock.commandCalls(ExportComponentsCommand)).toHaveLength(2);
    expect(amplifyUIBuilderMock.commandCalls(CreateComponentCommand)).toHaveLength(1);
  });
});
