import { $TSContext } from 'amplify-cli-core';

describe('should sync amplify ui builder components', () => {
  let context: $TSContext | any;
  let aws: any;
  let FeatureFlags: any;
  let sc: any;
  beforeEach(() => {
    aws = require('aws-sdk');
    FeatureFlags = require('amplify-cli-core').FeatureFlags;
    FeatureFlags.getBoolean = () => false;
    FeatureFlags.getNumber = () => 0;
    sc = require('../commands/utils/createUiBuilderComponent');
    context = {
      exeInfo: {
        projectConfig: {
          javascript: {
            config: {
              SourceDir: 'src',
            },
          },
        },
      },
      amplify: {
        invokePluginMethod: () => ({}),
      },
      parameters: {
        argv: [],
      },
      input: {},
    };

    aws.AmplifyUIBuilder = jest.fn(() => ({
      exportComponents: jest.fn(() => ({
        promise: jest.fn(() => ({
          entities: [
            {
              appId: 'd37nrm8rzt3oek',
              bindingProperties: {},
              componentType: 'Box',
              environmentName: 'staging',
              id: 's-s4mU579Ycf6JGHwhqT',
              name: 'aawwdd',
              overrides: {},
              properties: {},
              variants: [],
            },
          ],
        })),
      })),
      exportThemes: jest.fn(() => ({
        promise: jest.fn(() => ({
          entities: [],
        })),
      })),
    }));

    sc.createUiBuilderComponent = jest.fn();
  });

  it('pulls components from aws-sdk and passes them to createUiBuilderComponent', () => {
    const { generateUiBuilderComponents } = require('../commands/utils/syncAmplifyUiBuilderComponents');
    generateUiBuilderComponents(context, []);
  });

  it('does not throw an error when createUiBuilderComponent fails', () => {
    sc.createUiBuilderComponent = jest.fn(() => {
      throw new Error('ahhh!');
    });
    const { generateUiBuilderComponents } = require('../commands/utils/syncAmplifyUiBuilderComponents');
    expect(async () => generateUiBuilderComponents(context, [])).not.toThrow();
  });

  it('does not throw an error when createUiBuilderThemes fails', () => {
    sc.createUiBuilderComponent = jest.fn(() => {
      throw new Error('ahhh!');
    });
    const { generateUiBuilderThemes } = require('../commands/utils/syncAmplifyUiBuilderComponents');
    expect(async () => generateUiBuilderThemes(context, [])).not.toThrow();
  });
});
