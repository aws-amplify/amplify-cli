import { AmplifyCategories, AmplifySupportedService, stateManager } from 'amplify-cli-core'; // eslint-disable-line import/no-extraneous-dependencies
import aws from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import {
  generateUiBuilderComponents,
  generateUiBuilderThemes,
  getEnvName,
  getAppId,
  resolveAppId,
} from '../commands/utils';
import { AmplifyStudioClient } from '../clients';
import * as createUiBuilderComponentDependency from '../commands/utils/codegenResources';

jest.mock('amplify-cli-core', () => ({
  ...jest.requireActual('amplify-cli-core'),
  FeatureFlags: {
    getBoolean: () => false,
    getNumber: () => 0,
  },
}));

const awsMock = aws as any;
const stateManagerMock = stateManager as any;
const createUiBuilderComponentDependencyMock = createUiBuilderComponentDependency as any;
describe('should sync amplify ui builder components', () => {
  let context: any;
  beforeEach(() => {
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

    stateManagerMock.getMeta = jest.fn(() => ({
      [AmplifyCategories.API]: {
        MyResourceName: {
          service: AmplifySupportedService.APPSYNC,
        },
      },
      providers: {
        awscloudformation: { AmplifyAppId: 'testAppId' },
      },
    }));

    awsMock.AmplifyUIBuilder = jest.fn(() => ({
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

    createUiBuilderComponentDependencyMock.createUiBuilderComponent = jest.fn();
    createUiBuilderComponentDependencyMock.createUiBuilderTheme = jest.fn();
  });

  it('pulls components from aws-sdk and passes them to createUiBuilderComponent', () => {
    generateUiBuilderComponents(context, []);
  });

  it('does not throw an error when createUiBuilderComponent fails', () => {
    createUiBuilderComponentDependencyMock.createUiBuilderComponent = jest.fn(() => {
      throw new Error('ahhh!');
    });
    expect(async () => generateUiBuilderComponents(context, [])).not.toThrow();
  });

  it('does not throw an error when createUiBuilderThemes fails', () => {
    createUiBuilderComponentDependencyMock.createUiBuilderComponent = jest.fn(() => {
      throw new Error('ahhh!');
    });
    expect(async () => generateUiBuilderThemes(context, [])).not.toThrow();
  });

  it('can getAmplifyUIBuilderService', async () => {
    process.env.UI_BUILDER_ENDPOINT = 'https://mock-endpoint.com';
    process.env.UI_BUILDER_REGION = 'mock-region';
    const client = await AmplifyStudioClient.setClientInfo(context);
    expect(Object.keys(client)).toEqual(expect.arrayContaining([
      'listComponents',
      'listThemes',
      'getModels',
      'createComponent',
    ]));
  });
  it('can list themes', async () => {
    const client = await AmplifyStudioClient.setClientInfo(context);
    const themes = await client.listThemes();
    expect(themes.entities).toHaveLength(1);
  });
  it('can listUiBuilderComponents', async () => {
    const client = await AmplifyStudioClient.setClientInfo(context);
    const components = await client.listThemes();
    expect(components.entities).toHaveLength(1);
  });
  it('can getAppId', async () => {
    const appId = getAppId(context);
    expect(appId).toBe('testAppId');
  });
  it('can getEnvName', () => {
    const envName = getEnvName(context);
    expect(envName).toBe('testEnvName');
  });
  it('can resolveAppId', async () => {
    const appId = resolveAppId();
    expect(appId).toBe('testAppId');
  });
  it('can throw on getAppId', async () => {
    context.input.options.appId = null;
    context.amplify.invokePluginMethod = () => null;
    stateManagerMock.getMeta = () => ({});
    expect(() => getAppId(context)).toThrowError();
  });
  it('can generate ui builder components', async () => {
    createUiBuilderComponentDependencyMock.createUiBuilderComponent = jest.fn().mockImplementation(() => ({}));
    const components = generateUiBuilderComponents(context, [{}, {}]);
    expect(components.every(component => component.resultType === 'SUCCESS')).toBeTruthy();
  });
  it('can handle failed generation generate ui builder components', async () => {
    createUiBuilderComponentDependencyMock.createUiBuilderComponent = jest.fn().mockImplementation(() => {
      throw new Error('ahh!');
    });
    const components = generateUiBuilderComponents(context, [{}, {}]);
    expect(components.every(component => component.resultType === 'FAILURE')).toBeTruthy();
  });
  it('can generate ui builder themes', async () => {
    createUiBuilderComponentDependencyMock.createUiBuilderTheme = jest.fn().mockImplementation(() => ({}));
    const themes = generateUiBuilderThemes(context, [{}, {}]);
    expect(themes.every(theme => theme.resultType === 'SUCCESS')).toBeTruthy();
  });
  it('can handle failed generation generate ui builder themes', async () => {
    createUiBuilderComponentDependencyMock.createUiBuilderTheme = jest.fn().mockImplementation(() => {
      throw new Error('ahh!');
    });
    const themes = generateUiBuilderThemes(context, [{}, {}]);
    expect(themes.every(theme => theme.resultType === 'FAILURE')).toBeTruthy();
  });
});
