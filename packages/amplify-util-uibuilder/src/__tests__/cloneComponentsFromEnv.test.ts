import * as extractArgsDependency from '../commands/utils/extractArgs';
import * as listUiBuilderComponentsDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import { run } from '../commands/cloneComponentsFromEnv';

const extractArgsDependencyMock = extractArgsDependency as any;
const listUiBuilderComponentsDependencyMock = listUiBuilderComponentsDependency as any;

jest.mock('../commands/utils/extractArgs');
jest.mock('../commands/utils/syncAmplifyUiBuilderComponents');
jest.mock('../clients', () => ({
  AmplifyClientFactory: {
    setClientInfo: jest.fn(),
    amplifyUiBuilder: {
      createComponent: () => ({
        promise: () => true,
      }),
    },
    amplifyBackend: jest.fn(),
  },
}));

describe('can clone components to new environment', () => {
  let context: any;
  beforeEach(() => {
    context = {
      amplify: {
        invokePluginMethod: () => true,
      },
      input: {
        options: {
          appId: 'testAppId',
          envName: 'testEnvName',
        },
      },
    };
    extractArgsDependencyMock.extractArgs = jest.fn().mockImplementation(() => ({
      sourceEnvName: 'sourceEnvName',
      newEnvName: 'newEnvName',
      appId: 'appId',
      environmentName: 'environmentName',
    }));
    listUiBuilderComponentsDependencyMock.listUiBuilderComponents = jest.fn().mockImplementation((context: any, envName: any) => {
      if (envName === 'newEnvName') {
        return {
          entities: [],
        };
      }
      return {
        entities: [{}],
      };
    });
  });
  it('clones components to a new env', async () => {
    await run(context);
    expect(listUiBuilderComponentsDependency.listUiBuilderComponents).toBeCalledTimes(2);
  });
});
