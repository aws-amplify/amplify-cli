import { AmplifyCategories, AmplifySupportedService, stateManager } from '@aws-amplify/amplify-cli-core';
import aws from 'aws-sdk';
import {
  getEnvName,
  getAppId,
  resolveAppId,
  mapGenericDataSchemaToCodegen,
  waitForSucceededJob,
  extractUIComponents,
  fetchWithRetries,
} from '../commands/utils';
import { AmplifyStudioClient } from '../clients';
import { isDataStoreEnabled } from '@aws-amplify/amplify-category-api';
import type { GenericDataSchema } from '@aws-amplify/codegen-ui';
import fetch, { Response } from 'node-fetch';
import { existsSync, writeFileSync } from 'fs';

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
  isDataStoreEnabled: jest.fn(),
}));
jest.mock('fs');
jest.mock('node-fetch');

const awsMock = aws as any;
const stateManagerMock = stateManager as any;
const isDataStoreEnabledMocked = jest.mocked(isDataStoreEnabled);
const mockWriteFileSync = jest.mocked(writeFileSync);
const mockExistsSync = jest.mocked(existsSync);
const mockNodeFetch = jest.mocked(fetch);

describe('should sync amplify ui builder components', () => {
  let context: any;
  const env = process.env;

  const mockGenericDataSchema: GenericDataSchema = {
    dataSourceType: 'DataStore',
    models: {
      Blog: {
        fields: {
          id: { dataType: 'ID', required: true, readOnly: false, isArray: false },
        },
        primaryKeys: ['id'],
      },
    },
    enums: {
      Status: { values: ['ENABLED', 'DISABLED', 'HIDDEN'] },
    },
    nonModels: {
      Metadata: {
        fields: {
          name: {
            dataType: 'String',
            required: false,
            readOnly: false,
            isArray: false,
          },
        },
      },
    },
  };

  beforeEach(() => {
    mockNodeFetch.mockReset();
    process.env = { ...env };

    isDataStoreEnabledMocked.mockResolvedValue(true);
    mockExistsSync.mockReturnValue(false);
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
  });

  afterEach(() => {
    process.env = env;
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

  it('can map generic data schema to start codegen job request', () => {
    expect(mapGenericDataSchemaToCodegen(mockGenericDataSchema)).toMatchSnapshot();
  });

  it('can wait for a succeeded job', async () => {
    const succeededJob = { status: 'succeeded' };
    const getJob = jest.fn().mockResolvedValueOnce({ status: 'in_progress' }).mockResolvedValueOnce(succeededJob);
    const job = await waitForSucceededJob(getJob, { pollInterval: 1 });
    expect(job).toEqual(succeededJob);
  });

  it('can throw if job failed', async () => {
    const statusMessage = 'failed status';
    const getJob = jest.fn().mockResolvedValueOnce({ status: 'in_progress' }).mockResolvedValueOnce({ status: 'failed', statusMessage });
    await expect(waitForSucceededJob(getJob, { pollInterval: 2 })).rejects.toThrow(statusMessage);
  });

  it('can throw after timeout when waiting for a succeeded job', async () => {
    process.env.UI_BUILDER_CODEGENJOB_TIMEOUT = '1';
    const succeededJob = { status: 'succeeded' };
    const getJob = jest.fn().mockResolvedValueOnce({ status: 'in_progress' }).mockResolvedValueOnce(succeededJob);
    await expect(waitForSucceededJob(getJob, { pollInterval: 2 })).rejects.toThrow('Failed to return codegen job');
  });

  it('can extract ui components from archive', async () => {
    const mockedFetchResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        Output: [
          {
            downloadUrl: 'https://s3.com',
            fileName: 'MyComponent.jsx',
            schemaName: 'MyComponent',
          },
        ],
      }),
      text: jest.fn().mockResolvedValue('source code'),
    } as unknown as Response;
    mockNodeFetch.mockResolvedValue(mockedFetchResponse);
    mockExistsSync.mockReturnValue(true);
    await extractUIComponents('https:://example.aws', 'tmp/ui-components');
    expect(mockWriteFileSync).toHaveBeenCalledWith('tmp/ui-components/MyComponent.jsx', 'source code');
  });

  it('fetchWithRetries retries 3 times', async () => {
    mockNodeFetch.mockRejectedValue(new Error('Server dropped the connection'));
    await expect(fetchWithRetries('https://amazon.com')).rejects.toThrowError('Fetch reached max number of retries without succeeding');
    expect(mockNodeFetch).toHaveBeenCalledTimes(3);
  });
});
