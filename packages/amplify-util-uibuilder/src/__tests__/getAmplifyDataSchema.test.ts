import aws, { AmplifyBackend } from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import { $TSContext, AmplifyCategories, AmplifySupportedService } from 'amplify-cli-core'; // eslint-disable-line import/no-extraneous-dependencies
import { getAmplifyDataSchema } from '../commands/utils/getAmplifyDataSchema';
import { AmplifyClientFactory } from '../clients';

const awsMock = aws as any;

jest.mock('amplify-cli-core', () => ({
  ...jest.requireActual('amplify-cli-core'),
  stateManager: {
    getCurrentMeta: jest.fn(() => ({
      [AmplifyCategories.API]: {
        MyResourceName: {
          service: AmplifySupportedService.APPSYNC,
        },
      },
    })),
  },
  FeatureFlags: {
    getBoolean: () => false,
    getNumber: () => 0,
  },
}));

// eslint-disable-next-line spellcheck/spell-checker, no-useless-escape
const getMockedSchema = (): string => `export const schema = {\n    \"models\": {\n        \"Blog\": {\n            \"name\": \"Blog\",\n            \"fields\": {\n                \"id\": {\n                    \"name\": \"id\",\n                    \"isArray\": false,\n                    \"type\": \"ID\",\n                    \"isRequired\": true,\n                    \"attributes\": []\n                },\n                \"title\": {\n                    \"name\": \"title\",\n                    \"isArray\": false,\n                    \"type\": \"String\",\n                    \"isRequired\": false,\n                    \"attributes\": []\n                },\n                \"content\": {\n                    \"name\": \"content\",\n                    \"isArray\": false,\n                    \"type\": \"String\",\n                    \"isRequired\": false,\n                    \"attributes\": []\n                },\n                \"status\": {\n                    \"name\": \"status\",\n                    \"isArray\": false,\n                    \"type\": {\n                        \"enum\": \"Status\"\n                    },\n                    \"isRequired\": false,\n                    \"attributes\": []\n                },\n                \"createdAt\": {\n                    \"name\": \"createdAt\",\n                    \"isArray\": false,\n                    \"type\": \"AWSDateTime\",\n                    \"isRequired\": false,\n                    \"attributes\": [],\n                    \"isReadOnly\": true\n                },\n                \"updatedAt\": {\n                    \"name\": \"updatedAt\",\n                    \"isArray\": false,\n                    \"type\": \"AWSDateTime\",\n                    \"isRequired\": false,\n                    \"attributes\": [],\n                    \"isReadOnly\": true\n                }\n            },\n            \"syncable\": true,\n            \"pluralName\": \"Blogs\",\n            \"attributes\": [\n                {\n                    \"type\": \"model\",\n                    \"properties\": {}\n                },\n                {\n                    \"type\": \"auth\",\n                    \"properties\": {\n                        \"rules\": [\n                            {\n                                \"allow\": \"public\",\n                                \"operations\": [\n                                    \"create\",\n                                    \"update\",\n                                    \"delete\",\n                                    \"read\"\n                                ]\n                            }\n                        ]\n                    }\n                }\n            ]\n        }\n    },\n    \"enums\": {\n        \"Status\": {\n            \"name\": \"Status\",\n            \"values\": [\n                \"ENABLED\",\n                \"DISABLED\"\n            ]\n        }\n    },\n    \"nonModels\": {},\n    \"version\": \"demo\"\n};`;

describe('should sync amplify backend models', () => {
  let context: $TSContext | any;

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
    AmplifyClientFactory.flushAll();
  });

  it('should get AmplifyBackend', async () => {
    await AmplifyClientFactory.setClientInfo(context);
    const backend = AmplifyClientFactory.amplifyBackend;
    expect(backend).toBeInstanceOf(AmplifyBackend);
  });

  it('should getAmplifyBackendModels', async () => {
    awsMock.AmplifyBackend = jest.fn(() => ({
      getBackendAPIModels: jest.fn(() => ({
        promise: jest.fn(() => ({
          Models: getMockedSchema(),
        })),
      })),
    }));
    await AmplifyClientFactory.setClientInfo(context);
    const { dataSchema } = await getAmplifyDataSchema(context, 'testEnv');
    expect(dataSchema).toBeDefined();
    expect(Object.keys(dataSchema!.models)).toContain('Blog');
  });

  it('should handle Models not found', async () => {
    awsMock.AmplifyBackend = jest.fn(() => ({
      getBackendAPIModels: jest.fn(() => ({
        promise: jest.fn(() => ({
          Models: undefined,
        })),
      })),
    }));
    await AmplifyClientFactory.setClientInfo(context);
    const { dataSchema, error } = await getAmplifyDataSchema(context, 'testEnv');
    expect(dataSchema).toBeUndefined();
    expect(error?.message).toBe('Models not found in AmplifyBackend:GetBackendAPIModels response');
  });

  it('should handle network error', async () => {
    awsMock.AmplifyBackend = jest.fn(() => ({
      getBackendAPIModels: jest.fn(() => ({
        promise: jest.fn().mockRejectedValue(new Error('Network Error')),
      })),
    }));
    await AmplifyClientFactory.setClientInfo(context);
    const { error } = await getAmplifyDataSchema(context, 'testEnv');
    expect(error?.message).toBe('Network Error');
  });
});
