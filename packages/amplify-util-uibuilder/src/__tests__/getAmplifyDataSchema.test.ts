import aws from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import { AmplifyCategories, AmplifySupportedService, FeatureFlags } from 'amplify-cli-core'; // eslint-disable-line import/no-extraneous-dependencies
import { printer } from 'amplify-prompts'; // eslint-disable-line import/no-extraneous-dependencies
import { mocked } from 'ts-jest/utils';
import { AmplifyStudioClient } from '../clients';
import { getAmplifyDataSchema } from '../commands/utils';

const awsMock = aws as any;
const printerMock = printer as any;

jest.mock('amplify-cli-core', () => ({
  ...jest.requireActual('amplify-cli-core'),
  stateManager: {
    getMeta: jest.fn(() => ({
      [AmplifyCategories.API]: {
        MyResourceName: {
          service: AmplifySupportedService.APPSYNC,
        },
      },
    })),
    getCLIJSON: jest.fn().mockReturnValue({ features: { graphqltransformer: { transformerversion: 1 } } }),
    setCLIJSON: jest.fn(),
  },
  FeatureFlags: {
    getBoolean: () => true,
    getNumber: jest.fn(),
    reloadValues: jest.fn(),
  },
}));
jest.mock('amplify-prompts');

const mockedFeatureFlags = mocked(FeatureFlags);

const getMockedSchema = jest.fn(
  // eslint-disable-next-line no-useless-escape, spellcheck/spell-checker
  () => `export const schema = {\n    \"models\": {\n        \"Blog\": {\n            \"name\": \"Blog\",\n            \"fields\": {\n                \"id\": {\n                    \"name\": \"id\",\n                    \"isArray\": false,\n                    \"type\": \"ID\",\n                    \"isRequired\": true,\n                    \"attributes\": []\n                },\n                \"title\": {\n                    \"name\": \"title\",\n                    \"isArray\": false,\n                    \"type\": \"String\",\n                    \"isRequired\": false,\n                    \"attributes\": []\n                },\n                \"content\": {\n                    \"name\": \"content\",\n                    \"isArray\": false,\n                    \"type\": \"String\",\n                    \"isRequired\": false,\n                    \"attributes\": []\n                },\n                \"status\": {\n                    \"name\": \"status\",\n                    \"isArray\": false,\n                    \"type\": {\n                        \"enum\": \"Status\"\n                    },\n                    \"isRequired\": false,\n                    \"attributes\": []\n                },\n                \"createdAt\": {\n                    \"name\": \"createdAt\",\n                    \"isArray\": false,\n                    \"type\": \"AWSDateTime\",\n                    \"isRequired\": false,\n                    \"attributes\": [],\n                    \"isReadOnly\": true\n                },\n                \"updatedAt\": {\n                    \"name\": \"updatedAt\",\n                    \"isArray\": false,\n                    \"type\": \"AWSDateTime\",\n                    \"isRequired\": false,\n                    \"attributes\": [],\n                    \"isReadOnly\": true\n                }\n            },\n            \"syncable\": true,\n            \"pluralName\": \"Blogs\",\n            \"attributes\": [\n                {\n                    \"type\": \"model\",\n                    \"properties\": {}\n                },\n                {\n                    \"type\": \"auth\",\n                    \"properties\": {\n                        \"rules\": [\n                            {\n                                \"allow\": \"public\",\n                                \"operations\": [\n                                    \"create\",\n                                    \"update\",\n                                    \"delete\",\n                                    \"read\"\n                                ]\n                            }\n                        ]\n                    }\n                }\n            ]\n        }\n    },\n    \"enums\": {\n        \"Status\": {\n            \"name\": \"Status\",\n            \"values\": [\n                \"ENABLED\",\n                \"DISABLED\"\n            ]\n        }\n    },\n    \"nonModels\": {},\n    \"version\": \"demo\"\n};`,
);

describe('should sync amplify backend models', () => {
  let context: any;

  beforeAll(() => {
    // set metadata response
    awsMock.AmplifyUIBuilder = jest.fn(() => ({
      getMetadata: jest.fn(() => ({
        promise: jest.fn(() => ({
          features: {
            autoGenerateForms: 'true',
            autoGenerateViews: 'true',
          },
        })),
      })),
    }));
  });

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
      print: { warning: jest.fn() },
    };

    mockedFeatureFlags.getNumber.mockReturnValue(2);
    getMockedSchema.mockClear();
    awsMock.AmplifyBackend = jest.fn().mockReturnValue({
      getBackendAPIModels: jest.fn().mockReturnValue({
        promise: () => ({
          Models: getMockedSchema(),
        }),
      }),
    });
  });

  it('should getAmplifyBackendModels', async () => {
    const client = await AmplifyStudioClient.setClientInfo(context);
    const dataSchema = await getAmplifyDataSchema(client);
    expect(getMockedSchema).toBeCalled();
    expect(dataSchema).toBeDefined();
    expect(Object.keys(dataSchema!.models)).toContain('Blog');
  });

  it('should not getAmplifyBackendModels and return undefined if graphQLTransformer version not supported', async () => {
    mockedFeatureFlags.getNumber.mockReturnValue(1);
    const client = await AmplifyStudioClient.setClientInfo(context);
    const dataSchema = await getAmplifyDataSchema(client);
    expect(getMockedSchema).not.toBeCalled();
    expect(dataSchema).toBeUndefined();
  });

  it('should handle Models not found', async () => {
    awsMock.AmplifyBackend = jest.fn().mockReturnValue({
      getBackendAPIModels: jest.fn().mockReturnValue({
        promise: () => ({
          Models: undefined,
        }),
      }),
    });
    const client = await AmplifyStudioClient.setClientInfo(context);
    const dataSchema = await getAmplifyDataSchema(client);
    expect(dataSchema).toBeUndefined();
    expect(printerMock.debug).toHaveBeenCalledWith('Provided ResourceName: MyResourceName did not yield Models.');
  });

  it('should handle network error', async () => {
    awsMock.AmplifyBackend = jest.fn().mockReturnValue({
      getBackendAPIModels: jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Network Error')),
      }),
    });
    const client = await AmplifyStudioClient.setClientInfo(context);
    const dataSchema = await getAmplifyDataSchema(client);
    expect(dataSchema).toBeUndefined();
    expect(printerMock.debug).toHaveBeenCalledWith('Error: Models not found in AmplifyBackend:GetBackendAPIModels response: Network Error');
  });
});
