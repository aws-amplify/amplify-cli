const aws = require('aws-sdk');
const { FeatureFlags } = require('amplify-cli-core');
FeatureFlags.getBoolean = () => false;
FeatureFlags.getNumber = () => 0;
const sc = require('../createUiBuilderComponent');
const context = {
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

describe('should sync amplify ui builder components', () => {
  beforeEach(() => {
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
    const { generateUiBuilderComponents } = require('../syncAmplifyUiBuilderComponents');
    generateUiBuilderComponents(context, []);
  });

  it('does not throw an error when createUiBuilderComponent fails', () => {
    sc.createUiBuilderComponent = jest.fn(() => {
      throw new Error('ahhh!');
    });
    const { generateUiBuilderComponents } = require('../syncAmplifyUiBuilderComponents');
    expect(async () => generateUiBuilderComponents(context, [])).not.toThrow();
  });
});
