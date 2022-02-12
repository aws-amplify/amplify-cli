import * as extractArgsDependency from '../commands/utils/extractArgs';
import * as listUiBuilderComponentsDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import { run } from '../commands/cloneComponentsFromEnv';
const extractArgsDependency_mock = extractArgsDependency as any;
const listUiBuilderComponentsDependency_mock = listUiBuilderComponentsDependency as any;
jest.mock('@aws-sdk/client-amplifyuibuilder', () => {
  return {
    AmplifyUIBuilder: jest.fn(() => {
      return {
        createComponent: () => true,
      };
    }),
  };
});
jest.mock('../commands/utils/extractArgs');
jest.mock('../commands/utils/syncAmplifyUiBuilderComponents');

describe('can clone components to new environment', () => {
  let context: any;
  beforeEach(() => {
    context = {
      amplify: {
        invokePluginMethod: () => true,
      },
    };
    extractArgsDependency_mock.extractArgs = jest.fn().mockImplementation(() => ({
      sourceEnvName: 'sourceEnvName',
      newEnvName: 'newEnvName',
      appId: 'appId',
      environmentName: 'environmentName',
    }));
    listUiBuilderComponentsDependency_mock.listUiBuilderComponents = jest.fn().mockImplementation((context: any, envName: any) => {
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
