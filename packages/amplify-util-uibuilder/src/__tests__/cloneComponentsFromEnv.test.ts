describe('can clone components to new environment', () => {
  let context: any;
  let aws: any;
  let listUiBuilderComponents: any;
  let extractArgs: any;
  beforeEach(() => {
    /*
    import aws from 'aws-sdk';
    import { extractArgs } from './utils/extractArgs';
    import { listUiBuilderComponents } from './utils/syncAmplifyUiBuilderComponents';
    */
    context = {
      amplify: {
        invokePluginMethod: () => true,
      },
    };
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
    jest.mock('../commands/utils/syncAmplifyUiBuilderComponents');
    aws = require('aws-sdk');
    extractArgs = require('../commands/utils/extractArgs').extractArgs;
    listUiBuilderComponents = require('../commands/utils/syncAmplifyUiBuilderComponents').listUiBuilderComponents;
    extractArgs.mockImplementation(() => ({
      sourceEnvName: 'sourceEnvName',
      newEnvName: 'newEnvName',
      appId: 'appId',
      environmentName: 'environmentName',
    }));
    listUiBuilderComponents.mockImplementation((context: any, envName: any) => {
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
    const { run } = require('../commands/cloneComponentsFromEnv');
    await run(context);
  });
});
