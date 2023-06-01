/* eslint-disable spellcheck/spell-checker */
import { AmplifyCategories, AmplifySupportedService, stateManager } from '@aws-amplify/amplify-cli-core'; // eslint-disable-line import/no-extraneous-dependencies
import aws from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import {
  generateUiBuilderComponents,
  generateUiBuilderThemes,
  getEnvName,
  getAppId,
  resolveAppId,
  generateUiBuilderForms,
} from '../commands/utils';
import { AmplifyStudioClient } from '../clients';
import * as createUiBuilderComponentDependency from '../commands/utils/codegenResources';
import { exampleSchema } from './utils';
import { isDataStoreEnabled } from '@aws-amplify/amplify-category-api';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  FeatureFlags: {
    getBoolean: () => false,
    getNumber: () => 0,
  },
}));
jest.mock('../commands/utils/featureFlags', () => ({
  getTransformerVersion: jest.fn().mockReturnValue(2),
}));

jest.mock('@aws-amplify/amplify-category-api', () => ({
  ...jest.requireActual('@aws-amplify/amplify-category-api'),
  isDataStoreEnabled: jest.fn(),
}));

const awsMock = aws as any;
const stateManagerMock = stateManager as any;
const createUiBuilderComponentDependencyMock = createUiBuilderComponentDependency as any;
const isDataStoreEnabledMocked = jest.mocked(isDataStoreEnabled);

describe('should sync amplify ui builder components', () => {
  let context: any;
  beforeEach(() => {
    isDataStoreEnabledMocked.mockResolvedValue(true);
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
              appId: 'd37nrm8rzt3oek', // eslint-disable-line spellcheck/spell-checker
              bindingProperties: {},
              componentType: 'Box',
              environmentName: 'staging',
              id: 's-s4mU579Ycf6JGHwhqT', // eslint-disable-line spellcheck/spell-checker
              name: 'aawwdd', // eslint-disable-line spellcheck/spell-checker
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
      exportForms: jest.fn(() => ({
        promise: jest.fn(() => ({
          entities: [
            {
              name: 'BasicFormCreate',
              formActionType: 'create',
              dataType: {
                dataSourceType: 'Custom',
                dataTypeName: 'Post',
              },
              fields: {
                name: {
                  inputType: {
                    required: true,
                    type: 'TextField',
                    name: 'name',
                    defaultValue: 'John Doe',
                  },
                  label: 'name',
                },
              },
              sectionalElements: {},
              style: {},
            },
          ],
        })),
      })),
      exportViews: jest.fn(() => ({
        promise: jest.fn(() => ({
          entities: [
            {
              appId: '23342',
              dataSource: { type: 'Custom' },
              environmentName: 'staging',
              id: 'id',
              name: 'ProductTable',
              // TODO: replace with export when Codegen updated
              schemaVersion: '1.0',
              style: {},
              viewConfiguration: {
                type: 'Table',
              },
            },
          ],
        })),
      })),
      getMetadata: jest.fn(() => ({
        promise: jest.fn(() => ({
          features: {
            autoGenerateForms: 'true',
            autoGenerateViews: 'true',
            formFeatureFlags: {
              isRelationshipSupported: 'false',
              isNonModelSupported: 'false',
            },
          },
        })),
      })),
    }));

    createUiBuilderComponentDependencyMock.createUiBuilderComponent = jest.fn();
    createUiBuilderComponentDependencyMock.createUiBuilderTheme = jest.fn();
    createUiBuilderComponentDependencyMock.createUiBuilderForm = jest.fn();
    createUiBuilderComponentDependencyMock.createUiBuilderView = jest.fn();
  });

  it('pulls components from aws-sdk and passes them to createUiBuilderComponent', () => {
    generateUiBuilderComponents(context, []);
  });

  it('does not throw an error when createUiBuilderComponent fails', () => {
    createUiBuilderComponentDependencyMock.createUiBuilderComponent = jest.fn(() => {
      throw new Error('ahhh!'); // eslint-disable-line spellcheck/spell-checker
    });
    expect(async () => generateUiBuilderComponents(context, [])).not.toThrow();
  });

  it('does not throw an error when createUiBuilderThemes fails', () => {
    createUiBuilderComponentDependencyMock.createUiBuilderComponent = jest.fn(() => {
      throw new Error('ahhh!'); // eslint-disable-line spellcheck/spell-checker
    });
    expect(async () => generateUiBuilderThemes(context, [])).not.toThrow();
  });

  it('can getAmplifyUIBuilderService', async () => {
    process.env.UI_BUILDER_ENDPOINT = 'https://mock-endpoint.com';
    process.env.UI_BUILDER_REGION = 'mock-region';
    const client = await AmplifyStudioClient.setClientInfo(context);
    expect(Object.keys(client)).toEqual(
      expect.arrayContaining(['listComponents', 'listThemes', 'listForms', 'getModels', 'loadMetadata', 'createComponent']),
    );
    expect(client.metadata).toEqual(
      expect.objectContaining({
        autoGenerateForms: true,
        autoGenerateViews: true,
        formFeatureFlags: {
          isRelationshipSupported: false,
          isNonModelSupported: false,
        },
      }),
    );
  });
  it('can list components', async () => {
    const client = await AmplifyStudioClient.setClientInfo(context);
    const components = await client.listComponents();
    expect(components.entities).toHaveLength(1);
  });
  it('can list themes', async () => {
    const client = await AmplifyStudioClient.setClientInfo(context);
    const themes = await client.listThemes();
    expect(themes.entities).toHaveLength(1);
  });
  it('can list forms', async () => {
    const client = await AmplifyStudioClient.setClientInfo(context);
    const forms = await client.listForms();
    expect(forms.entities).toHaveLength(1);
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
    expect(components.every((component) => component.resultType === 'SUCCESS')).toBeTruthy();
  });
  it('can handle failed generation generate ui builder components', async () => {
    createUiBuilderComponentDependencyMock.createUiBuilderComponent = jest.fn().mockImplementation(() => {
      throw new Error('ahh!');
    });
    const components = generateUiBuilderComponents(context, [{}, {}]);
    expect(components.every((component) => component.resultType === 'FAILURE')).toBeTruthy();
  });
  it('can generate ui builder themes', async () => {
    createUiBuilderComponentDependencyMock.createUiBuilderTheme = jest.fn().mockImplementation(() => ({}));
    const themes = generateUiBuilderThemes(context, [{}, {}]);
    expect(themes.every((theme) => theme.resultType === 'SUCCESS')).toBeTruthy();
  });
  it('can handle failed generation generate ui builder themes', async () => {
    createUiBuilderComponentDependencyMock.createUiBuilderTheme = jest.fn().mockImplementation(() => {
      throw new Error('ahh!');
    });
    const themes = generateUiBuilderThemes(context, [{}, {}]);
    expect(themes.every((theme) => theme.resultType === 'FAILURE')).toBeTruthy();
  });
  it('can generate ui builder default theme when no themes are passed', async () => {
    createUiBuilderComponentDependencyMock.createUiBuilderTheme = jest.fn().mockImplementation(() => ({}));
    const themes = generateUiBuilderThemes(context, []);
    expect(themes.every((theme) => theme.resultType === 'SUCCESS')).toBeTruthy();
  });
  it('can handle failed generation generate ui builder default theme when no themes are passed', async () => {
    createUiBuilderComponentDependencyMock.createUiBuilderTheme = jest.fn().mockImplementation(() => {
      throw new Error('ahh!');
    });
    const themes = generateUiBuilderThemes(context, []);
    expect(themes.every((theme) => theme.resultType === 'FAILURE')).toBeTruthy();
  });
  it('can generate ui builder forms', async () => {
    createUiBuilderComponentDependencyMock.createUiBuilderForm = jest.fn().mockImplementation(() => ({}));
    const forms = generateUiBuilderForms(context, [{}, {}]);
    expect(forms.every((form) => form.resultType === 'SUCCESS')).toBeTruthy();
  });
  it('can handle failed generation generate ui builder forms', async () => {
    createUiBuilderComponentDependencyMock.createUiBuilderForm = jest.fn().mockImplementation(() => {
      throw new Error('ahh!');
    });
    const forms = generateUiBuilderForms(context, [{}, {}]);
    expect(forms.every((form) => form.resultType === 'FAILURE')).toBeTruthy();
  });
  it('can generate uibuilder forms from data schema if autogenerate true', async () => {
    createUiBuilderComponentDependencyMock.createUiBuilderForm = jest.fn().mockImplementation(() => ({}));
    const forms = generateUiBuilderForms(context, [], exampleSchema, true);
    expect(forms.every((form) => form.resultType === 'SUCCESS')).toBeTruthy();
    // create & update form for author model
    expect(forms.length).toEqual(2);
  });

  it('should not autogenerate forms for join tables or unsupported models', async () => {
    expect(Object.keys(exampleSchema.models)).toStrictEqual(['Author', 'JoinTable', 'EmptyModel']);
    createUiBuilderComponentDependencyMock.createUiBuilderForm = jest.fn().mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (_ctx, schema, _dataSchema) => ({ name: schema.dataType.dataTypeName }),
    );
    const forms = generateUiBuilderForms(context, [], exampleSchema, true);
    expect(forms.every((form) => form.resultType === 'SUCCESS')).toBeTruthy();
    // only create & update form for author model
    expect(forms.map((f) => (f.schema as any).name)).toStrictEqual(['Author', 'Author']);
  });

  it('does not generate uibuilder forms from data schema if autogenerate false', async () => {
    createUiBuilderComponentDependencyMock.createUiBuilderForm = jest.fn().mockImplementation(() => ({}));
    const forms = generateUiBuilderForms(context, [], exampleSchema, false);
    expect(forms.length).toEqual(0);
  });
});
