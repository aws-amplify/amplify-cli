import aws from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import * as utils from '../commands/utils';
import { run } from '../commands/generateComponents';

jest.mock('../commands/utils');
jest.mock('@aws-amplify/amplify-cli-core');
const awsMock = aws as any;
const utilsMock = utils as any;

utilsMock.shouldRenderComponents = jest.fn().mockReturnValue(true);
utilsMock.notifyMissingPackages = jest.fn().mockReturnValue(true);
utilsMock.getAmplifyDataSchema = jest.fn().mockReturnValue({});

jest.mock('../commands/utils/featureFlags', () => ({
  getTransformerVersion: jest.fn().mockReturnValue(2),
}));

describe('can generate components', () => {
  let context: any;
  let schemas: any;
  let mockedExport: jest.Mock<any, any>;
  beforeEach(() => {
    context = {
      amplify: {
        invokePluginMethod: () => ({}),
      },
      input: {
        options: {
          appId: 'testAppId',
          envName: 'testEnvName',
        },
      },
    };
    schemas = {
      entities: [
        {
          resultType: 'SUCCESS',
          schemaName: 'testSchema',
          name: 'testSchema',
          schemaVersion: '1.0',
        },
        {
          resultType: 'FAILURE',
          schemaName: 'testSchema',
          name: 'testSchema',
          schemaVersion: '1.0',
          schema: { id: 'f-123456', name: 'testSchema' },
        },
      ],
    };
    mockedExport = jest.fn().mockReturnValue({
      entities: schemas.entities,
    });
    awsMock.AmplifyUIBuilder = jest.fn().mockReturnValue({
      exportComponents: jest.fn().mockReturnValue({
        promise: () => mockedExport(),
      }),
      exportThemes: jest.fn().mockReturnValue({
        promise: () => mockedExport(),
      }),
      exportForms: jest.fn().mockReturnValue({
        promise: () => mockedExport(),
      }),
      exportViews: jest.fn().mockReturnValue({
        promise: () => mockedExport(),
      }),
      getMetadata: jest.fn().mockReturnValue({
        promise: jest.fn().mockReturnValue({
          features: {
            autoGenerateForms: 'true',
            autoGenerateViews: 'true',
            formFeatureFlags: {
              isRelationshipSupported: 'false',
              isNonModelSupported: 'false',
            },
          },
        }),
      }),
    });
    utilsMock.generateUiBuilderComponents = jest.fn().mockReturnValue(schemas.entities);
    utilsMock.generateUiBuilderThemes = jest.fn().mockReturnValue(schemas.entities);
    utilsMock.generateUiBuilderForms = jest.fn().mockReturnValue(schemas.entities);
    utilsMock.getAmplifyDataSchema = jest.fn().mockReturnValue(undefined);
    utilsMock.generateAmplifyUiBuilderIndexFile = jest.fn().mockReturnValue(true);
    utilsMock.generateAmplifyUiBuilderUtilFile = jest.fn().mockReturnValue(true);
    utilsMock.deleteDetachedForms = jest.fn();
  });

  it('runs generateComponents', async () => {
    await run(context, 'PostPull');
    expect(mockedExport).toBeCalledTimes(3);
    expect(utilsMock.generateUiBuilderComponents).toBeCalledTimes(1);
    expect(utilsMock.generateUiBuilderThemes).toBeCalledTimes(1);
    expect(utilsMock.generateUiBuilderForms).toBeCalledTimes(1);
    expect(utilsMock.deleteDetachedForms).toBeCalledTimes(1);
  });
});
