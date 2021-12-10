jest.mock('aws-sdk', () => {
  return {
    AmplifyUIBuilder: jest.fn(() => {
      return {
        createComponent: () => ({
          promise: () => true,
        }),
      };
    }),
  };
});
jest.mock('../commands/utils/extractArgs');
import * as extractArgsDependency from '../commands/utils/extractArgs';
jest.mock('../commands/utils/syncAmplifyUiBuilderComponents');
import * as listUiBuilderComponentsDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import { run } from '../commands/cloneComponentsFromEnv';

describe('can clone components to new environment', () => {
  let context: any;
  beforeEach(() => {
    context = {
      amplify: {
        invokePluginMethod: () => true,
      },
    };
    // @ts-ignore
    extractArgsDependency.extractArgs = jest.fn().mockImplementation(() => ({
      sourceEnvName: 'sourceEnvName',
      newEnvName: 'newEnvName',
      appId: 'appId',
      environmentName: 'environmentName',
    }));
    // @ts-ignore
    listUiBuilderComponentsDependency.listUiBuilderComponents = jest.fn().mockImplementation((context: any, envName: any) => {
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
