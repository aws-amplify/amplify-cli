import aws from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import * as utils from '../commands/utils';
import { run } from '../commands/generateComponents';
import { isDataStoreEnabled } from '@aws-amplify/amplify-category-api';
import { getTransformerVersion } from '../commands/utils/featureFlags';

jest.mock('../commands/utils');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-category-api', () => ({
  ...jest.requireActual('@aws-amplify/amplify-category-api'),
  isDataStoreEnabled: jest.fn(),
}));
jest.mock('../commands/utils/featureFlags', () => ({
  ...jest.requireActual('../commands/utils/featureFlags'),
  getTransformerVersion: jest.fn(),
}));
const awsMock = aws as any;
const utilsMock = utils as any;

const isDataStoreEnabledMocked = jest.mocked(isDataStoreEnabled);
const getTransformerVersionMocked = jest.mocked(getTransformerVersion);
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
  const getMetadataPromise = jest.fn().mockReturnValue({
    features: {
      autoGenerateForms: 'true',
      autoGenerateViews: 'true',
      formFeatureFlags: {
        isRelationshipSupported: 'false',
        isNonModelSupported: 'false',
      },
    },
  });
  beforeEach(() => {
    isDataStoreEnabledMocked.mockResolvedValue(true);
    getTransformerVersionMocked.mockResolvedValue(2);
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
        promise: getMetadataPromise,
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

  it('should autogenerate forms if transformer v2 and datastore and feature flag are enabled', async () => {
    isDataStoreEnabledMocked.mockResolvedValue(true);
    getTransformerVersionMocked.mockResolvedValue(2);
    getMetadataPromise.mockReturnValue({
      features: {
        autoGenerateForms: 'true',
        autoGenerateViews: 'true',
        formFeatureFlags: {
          isRelationshipSupported: 'false',
          isNonModelSupported: 'false',
        },
      },
    });
    await run(context, 'PostPull');
    expect(utilsMock.generateUiBuilderForms).toHaveBeenCalledWith(expect.anything(), expect.anything(), undefined, true, expect.anything());
  });

  it('should not autogenerate forms if transformer v1', async () => {
    isDataStoreEnabledMocked.mockResolvedValue(true);
    getTransformerVersionMocked.mockResolvedValue(1);
    getMetadataPromise.mockReturnValue({
      features: {
        autoGenerateForms: 'true',
        autoGenerateViews: 'true',
        formFeatureFlags: {
          isRelationshipSupported: 'false',
          isNonModelSupported: 'false',
        },
      },
    });
    await run(context, 'PostPull');
    expect(utilsMock.generateUiBuilderForms).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      undefined,
      false,
      expect.anything(),
    );
  });

  it('should not autogenerate forms if datastore is not enabled', async () => {
    isDataStoreEnabledMocked.mockResolvedValue(false);
    getMetadataPromise.mockReturnValue({
      features: {
        autoGenerateForms: 'true',
        autoGenerateViews: 'true',
        formFeatureFlags: {
          isRelationshipSupported: 'false',
          isNonModelSupported: 'false',
        },
      },
    });
    await run(context, 'PostPull');
    expect(utilsMock.generateUiBuilderForms).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      undefined,
      false,
      expect.anything(),
    );
  });

  it('should not autogenerate forms if feature flag  isnot enabled', async () => {
    isDataStoreEnabledMocked.mockResolvedValue(true);
    getMetadataPromise.mockReturnValue({
      features: {
        autoGenerateForms: 'false',
        autoGenerateViews: 'true',
        formFeatureFlags: {
          isRelationshipSupported: 'false',
          isNonModelSupported: 'false',
        },
      },
    });
    await run(context, 'PostPull');
    expect(utilsMock.generateUiBuilderForms).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      undefined,
      false,
      expect.anything(),
    );
  });
});
