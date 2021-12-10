import { $TSContext } from 'amplify-cli-core';
import {
  generateUiBuilderComponents,
  getEnvName,
  getAppId,
  listUiBuilderComponents,
  listUiBuilderThemes,
  getAmplifyUIBuilderService,
  resolveAppId,
  generateUiBuilderThemes,
} from '../commands/utils/syncAmplifyUiBuilderComponents';

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
      input: {
        options: {
          appId: 'testAppId',
          envName: 'testEnvName',
        },
      },
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
          entities: [{}],
        })),
      })),
    }));

    sc.createUiBuilderComponent = jest.fn();
    sc.createUiBuilderTheme = jest.fn();
  });

  it('pulls components from aws-sdk and passes them to createUiBuilderComponent', () => {
    generateUiBuilderComponents(context, []);
  });

  it('does not throw an error when createUiBuilderComponent fails', () => {
    sc.createUiBuilderComponent = jest.fn(() => {
      throw new Error('ahhh!');
    });
    expect(async () => generateUiBuilderComponents(context, [])).not.toThrow();
  });

  it('does not throw an error when createUiBuilderThemes fails', () => {
    sc.createUiBuilderComponent = jest.fn(() => {
      throw new Error('ahhh!');
    });
    const { generateUiBuilderThemes } = require('../commands/utils/syncAmplifyUiBuilderComponents');
    expect(async () => generateUiBuilderThemes(context, [])).not.toThrow();
  });

  it('can getAmplifyUIBuilderService', async () => {
    process.env.UI_BUILDER_ENDPOINT = 'https://mock-endpoint.com';
    process.env.UI_BUILDER_REGION = 'mock-region';
    const service = await getAmplifyUIBuilderService(context, 'testEnv', 'testAppId');
    expect(Object.keys(service)).toContain('exportComponents');
    expect(Object.keys(service)).toContain('exportThemes');
  });
  it('can listUiBuilderThemes', async () => {
    const themes = await listUiBuilderThemes(context, 'testEnv');
    expect(themes.entities).toHaveLength(1);
  });
  it('can listUiBuilderComponents', async () => {
    const components = await listUiBuilderComponents(context, 'testEnv');
    expect(components.entities).toHaveLength(1);
  });
  it('can getAppId', async () => {
    const appId = await getAppId(context);
    expect(appId).toBe('testAppId');
  });
  it('can getEnvName', () => {
    const envName = getEnvName(context);
    expect(envName).toBe('testEnvName');
  });
  it('can resolveAppId', async () => {
    context.amplify.invokePluginMethod = () => 'testAppId';
    const appId = await resolveAppId(context);
    expect(appId).toBe('testAppId');
  });
  it('can throw on getAppId', async () => {
    context.input.options.appId = null;
    context.amplify.invokePluginMethod = () => null;
    expect(async () => await getAppId(context)).rejects.toThrowError();
  });
  it('can generate ui builder components', async () => {
    sc.createUiBuilderComponent.mockImplementation(() => ({}));
    const components = generateUiBuilderComponents(context, [{}, {}]);
    expect(components.every(component => component.resultType === 'SUCCESS')).toBeTruthy();
  });
  it('can handle failed generation generate ui builder components', async () => {
    sc.createUiBuilderComponent.mockImplementation(() => {
      throw new Error('ahh!');
    });
    const components = generateUiBuilderComponents(context, [{}, {}]);
    expect(components.every(component => component.resultType === 'FAILURE')).toBeTruthy();
  });
  it('can generate ui builder themes', async () => {
    sc.createUiBuilderTheme.mockImplementation(() => ({}));
    const themes = generateUiBuilderThemes(context, [{}, {}]);
    expect(themes.every(theme => theme.resultType === 'SUCCESS')).toBeTruthy();
  });
  it('can handle failed generation generate ui builder themes', async () => {
    sc.createUiBuilderTheme.mockImplementation(() => {
      throw new Error('ahh!');
    });
    const themes = generateUiBuilderThemes(context, [{}, {}]);
    expect(themes.every(theme => theme.resultType === 'FAILURE')).toBeTruthy();
  });
});
