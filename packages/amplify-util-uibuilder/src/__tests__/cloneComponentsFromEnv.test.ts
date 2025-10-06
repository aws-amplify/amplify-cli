import { ExportComponentsCommand, CreateComponentCommand, GetMetadataCommand } from '@aws-sdk/client-amplifyuibuilder';
import * as extractArgsDependency from '../commands/utils/extractArgs';
import { run } from '../commands/cloneComponentsFromEnv';
import { isDataStoreEnabled } from '@aws-amplify/amplify-category-api';

const extractArgsDependencyMock = extractArgsDependency as any;
const mockSend = jest.fn();

jest.mock('@aws-sdk/client-amplifyuibuilder', () => ({
  ...jest.requireActual('@aws-sdk/client-amplifyuibuilder'),
  AmplifyUIBuilderClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
}));

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
    mockSend.mockReset();
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

    mockSend.mockImplementation((command) => {
      if (command instanceof ExportComponentsCommand) {
        if (command.input.environmentName === 'newEnvName') {
          return Promise.resolve({ entities: [] });
        }
        return Promise.resolve({ entities: [{}] });
      }
      if (command instanceof CreateComponentCommand) {
        return Promise.resolve({ entity: {} });
      }
      if (command instanceof GetMetadataCommand) {
        return Promise.resolve({
          features: {
            autoGenerateForms: 'true',
            autoGenerateViews: 'true',
            formFeatureFlags: {
              isRelationshipSupported: 'false',
              isNonModelSupported: 'false',
            },
          },
        });
      }
      return Promise.resole({});
    });
  });

  it('clones components to a new env', async () => {
    await run(context);
    expect(mockSend).toHaveBeenCalledTimes(4);
    expect(mockSend).toHaveBeenCalledWith(expect.any(ExportComponentsCommand));
    expect(mockSend).toHaveBeenCalledWith(expect.any(CreateComponentCommand));
  });
});
