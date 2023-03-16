import aws from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import { AmplifyCategories, AmplifySupportedService, FeatureFlags } from '@aws-amplify/amplify-cli-core'; // eslint-disable-line import/no-extraneous-dependencies
import { printer } from '@aws-amplify/amplify-prompts'; // eslint-disable-line import/no-extraneous-dependencies
import { mocked } from 'ts-jest/utils';
import { getAmplifyDataSchema } from '../commands/utils';

jest.mock('@aws-amplify/amplify-prompts');

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  stateManager: {
    getMeta: jest.fn(() => ({
      [AmplifyCategories.API]: {
        MyResourceName: {
          service: AmplifySupportedService.APPSYNC,
        },
      },
      syncable: true,
      pluralName: 'Users',
      attributes: [
        {
          type: 'model',
          properties: {},
        },
      ],
      primaryKeyInfo: {
        isCustomPrimaryKey: false,
        primaryKeyFieldName: 'id',
        sortKeyFieldNames: [],
      },
    },
  },
  enums: {},
  nonModels: {},
};

const mockedGetModelIntrospection = jest.fn();

describe('should sync amplify backend models', () => {
  let context: any;

  beforeEach(() => {
    context = {
      amplify: {
        invokePluginMethod: mockedGetModelIntrospection,
      },
    };

    mockedGetModelIntrospection.mockReset();
  });

  it('should get generic schema from introspection schema', async () => {
    mockedGetModelIntrospection.mockReturnValue(sampleIntrospectionSchema);

    const dataSchema = await getAmplifyDataSchema(context);
    expect(dataSchema).toBeDefined();
    expect(Object.keys(dataSchema!.models)).toContain('Blog');
  });

  it('should handle schema not found', async () => {
    mockedGetModelIntrospection.mockReturnValue(undefined);

    const dataSchema = await getAmplifyDataSchema(context);
    expect(dataSchema).toBeUndefined();
    expect(printerMock.debug).toHaveBeenCalledWith('Local schema not found');
  });

  it('should handle error', async () => {
    const error = new Error('Something went wrong');
    mockedGetModelIntrospection.mockImplementation(() => {
      throw error;
    });

    const dataSchema = await getAmplifyDataSchema(context);
    expect(dataSchema).toBeUndefined();
    expect(printerMock.debug).toHaveBeenCalledWith(error.toString());
  });
});
