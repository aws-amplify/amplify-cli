import {
  ExportComponentsCommand,
  ExportThemesCommand,
  ExportFormsCommand,
  GetMetadataCommand,
  StartCodegenJobCommand,
  GetCodegenJobCommand,
} from '@aws-sdk/client-amplifyuibuilder';
import { getCodegenConfig } from 'amplify-codegen';
import { isDataStoreEnabled } from '@aws-amplify/amplify-category-api';
import * as utils from '../commands/utils';
import { run } from '../commands/generateComponents';
import { getTransformerVersion } from '../commands/utils/featureFlags';
import { getUiBuilderComponentsPath } from '../commands/utils/getUiBuilderComponentsPath';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-amplifyuibuilder', () => ({
  ...jest.requireActual('@aws-sdk/client-amplifyuibuilder'),
  AmplifyUIBuilderClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
}));

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
jest.mock('../commands/utils/getUiBuilderComponentsPath', () => ({
  ...jest.requireActual('../commands/utils/getUiBuilderComponentsPath'),
  getUiBuilderComponentsPath: jest.fn(),
}));
jest.mock('amplify-codegen', () => ({
  ...jest.requireActual('amplify-codegen'),
  getCodegenConfig: jest.fn(),
}));

const utilsMock = utils as any;
const isDataStoreEnabledMocked = isDataStoreEnabled as any;
const getTransformerVersionMocked = getTransformerVersion as any;
const getCodegenConfigMocked = getCodegenConfig as any;
const getUiBuilderComponentsPathMocked = getUiBuilderComponentsPath as any;

utilsMock.shouldRenderComponents = jest.fn().mockReturnValue(true);
utilsMock.notifyMissingPackages = jest.fn().mockReturnValue(true);
utilsMock.getAmplifyDataSchema = jest.fn().mockReturnValue({});
utilsMock.isFormDetachedFromModel = jest.fn().mockReturnValue(false);
utilsMock.extractUIComponents = jest.fn().mockReturnValue(undefined);
utilsMock.waitForSucceededJob = jest
  .fn()
  .mockReturnValue({ asset: { downloadUrl: 'amazon.com' }, statusMessage: `{\"codegenErrors\": [{\"schemaName\": \"BlogUpdateForm\"}]}` });
utilsMock.parsePackageJsonFile = jest.fn().mockReturnValue({ dependencies: {} });
utilsMock.getStartCodegenJobDependencies = jest
  .fn()
  .mockReturnValue({ '@aws-amplify/ui-react': '4.6.0', 'aws-amplify': '^5.0.2', '@aws-amplify/ui-react-storage': '^1.2.0' });

jest.mock('../commands/utils/featureFlags', () => ({
  getTransformerVersion: jest.fn().mockReturnValue(2),
}));

const defaultStudioFeatureFlags = {
  autoGenerateForms: 'true',
  autoGenerateViews: 'true',
  isRelationshipSupported: 'false',
  isNonModelSupported: 'false',
  isGraphQLEnabled: 'true',
};

const projectPath = '/usr/test/test-project';

describe('can generate components', () => {
  let context: any;
  let schemas: any;
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset();

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
      exeInfo: {
        localEnvInfo: {
          projectPath,
        },
      },
    };
    schemas = {
      entities: [
        {
          schemaName: 'testSchema',
          name: 'testSchema',
          schemaVersion: '1.0',
        },
        {
          schemaName: 'testSchema',
          name: 'testSchema',
          schemaVersion: '1.0',
          schema: { id: 'f-123456', name: 'testSchema' },
        },
      ],
    };

    getCodegenConfigMocked.mockReturnValue({
      getGeneratedTypesPath: jest.fn().mockReturnValue(undefined),
      getGeneratedQueriesPath: jest.fn().mockReturnValue(projectPath + '/src/graphql/queries.js'),
      getGeneratedMutationsPath: jest.fn().mockReturnValue(projectPath + '/src/graphql/mutations.js'),
      getGeneratedSubscriptionsPath: jest.fn().mockReturnValue(projectPath + '/src/graphql/subscriptions.js'),
      getGeneratedFragmentsPath: jest.fn().mockReturnValue(projectPath + '/src/graphql/fragments.js'),
      getQueryMaxDepth: jest.fn().mockReturnValue(3),
    });

    mockSend.mockImplementation((command) => {
      if (command instanceof ExportComponentsCommand) {
        return Promise.resolve({ entities: schemas.entities });
      }
      if (command instanceof ExportThemesCommand) {
        return Promise.resolve({ entities: schemas.entities });
      }
      if (command instanceof ExportFormsCommand) {
        return Promise.resolve({ entities: schemas.entities });
      }
      if (command instanceof GetMetadataCommand) {
        return Promise.resolve({
          features: {
            ...defaultStudioFeatureFlags,
          },
        });
      }
      if (command instanceof StartCodegenJobCommand) {
        return Promise.resolve({ entity: { id: 'jobId123' } });
      }
      if (command instanceof GetCodegenJobCommand) {
        return Promise.resolve({ status: 'succeeded' });
      }
      return Promise.resole({});
    });

    getUiBuilderComponentsPathMocked.mockReturnValue(projectPath + '/src/ui-components');
    utilsMock.generateUiBuilderComponents = jest.fn().mockReturnValue(schemas.entities);
    utilsMock.generateUiBuilderThemes = jest.fn().mockReturnValue(schemas.entities);
    utilsMock.generateUiBuilderForms = jest.fn().mockReturnValue(schemas.entities);
    utilsMock.generateAmplifyUiBuilderIndexFile = jest.fn().mockReturnValue(true);
    utilsMock.generateAmplifyUiBuilderUtilFile = jest.fn().mockReturnValue(true);
    utilsMock.deleteDetachedForms = jest.fn();
  });

  it('runs generateComponents', async () => {
    utilsMock.isFormDetachedFromModel = jest.fn().mockReturnValueOnce(true);
    await run(context, 'PostPull');
    expect(mockSend).toHaveBeenCalledWith(expect.any(ExportComponentsCommand));
    expect(mockSend).toHaveBeenCalledWith(expect.any(ExportThemesCommand));
    expect(mockSend).toHaveBeenCalledWith(expect.any(ExportFormsCommand));
    expect(mockSend).toHaveBeenCalledWith(expect.any(StartCodegenJobCommand));
    expect(utilsMock.waitForSucceededJob).toBeCalledTimes(1);
    expect(getUiBuilderComponentsPathMocked).toBeCalledTimes(1);
    expect(utilsMock.extractUIComponents).toBeCalledTimes(1);
    expect(utilsMock.deleteDetachedForms).toBeCalledTimes(1);
  });

  it('should autogenerate forms if transformer v2 and datastore and feature flag are enabled', async () => {
    isDataStoreEnabledMocked.mockResolvedValue(true);
    getTransformerVersionMocked.mockResolvedValue(2);
    await run(context, 'PostPull');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          appId: 'testAppId',
          environmentName: 'testEnvName',
          codegenJobToCreate: expect.objectContaining({ autoGenerateForms: true }),
        },
      }),
    );
  });

  it('should not autogenerate forms if transformer v1', async () => {
    isDataStoreEnabledMocked.mockResolvedValue(true);
    getTransformerVersionMocked.mockResolvedValue(1);
    await run(context, 'PostPull');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          appId: 'testAppId',
          environmentName: 'testEnvName',
          codegenJobToCreate: expect.objectContaining({ autoGenerateForms: false }),
        },
      }),
    );
  });

  it('should not autogenerate forms if datastore is not enabled and GraphQL is not enabled', async () => {
    isDataStoreEnabledMocked.mockResolvedValue(false);
    mockSend.mockImplementationOnce((command) => {
      if (command instanceof GetMetadataCommand) {
        return Promise.resolve({
          features: {
            ...defaultStudioFeatureFlags,
            isGraphQLEnabled: 'false',
          },
        });
      }
      return Promise.resole({});
    });
    await run(context, 'PostPull');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          appId: 'testAppId',
          environmentName: 'testEnvName',
          codegenJobToCreate: expect.objectContaining({ autoGenerateForms: false }),
        },
      }),
    );
  });

  it('should not autogenerate forms if datastore is not enabled and GraphQL is enabled with invalid config', async () => {
    isDataStoreEnabledMocked.mockResolvedValue(false);
    mockSend.mockImplementationOnce((command) => {
      if (command instanceof GetMetadataCommand) {
        return Promise.resolve({
          features: {
            ...defaultStudioFeatureFlags,
            isGraphQLEnabled: 'true',
          },
        });
      }
      return Promise.resole({});
    });
    getCodegenConfigMocked.mockImplementation(() => {
      throw new Error();
    });
    await run(context, 'PostPull');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          appId: 'testAppId',
          environmentName: 'testEnvName',
          codegenJobToCreate: expect.objectContaining({ autoGenerateForms: false }),
        },
      }),
    );
  });

  it('should autogenerate forms if datastore is not enabled and GraphQL is enabled with valid config', async () => {
    isDataStoreEnabledMocked.mockResolvedValue(false);
    mockSend.mockImplementationOnce((command) => {
      if (command instanceof GetMetadataCommand) {
        return Promise.resolve({
          features: {
            ...defaultStudioFeatureFlags,
            isGraphQLEnabled: 'true',
          },
        });
      }
      return Promise.resole({});
    });
    await run(context, 'PostPull');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          appId: 'testAppId',
          environmentName: 'testEnvName',
          codegenJobToCreate: expect.objectContaining({ autoGenerateForms: true }),
        },
      }),
    );
  });

  it('should not autogenerate forms if feature flag  is not enabled', async () => {
    isDataStoreEnabledMocked.mockResolvedValue(true);
    mockSend.mockImplementationOnce((command) => {
      if (command instanceof GetMetadataCommand) {
        return Promise.resolve({
          features: {
            ...defaultStudioFeatureFlags,
            autoGenerateForms: 'false',
          },
        });
      }
      return Promise.resole({});
    });
    await run(context, 'PostPull');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          appId: 'testAppId',
          environmentName: 'testEnvName',
          codegenJobToCreate: expect.objectContaining({ autoGenerateForms: false }),
        },
      }),
    );
  });

  describe('codegen job creation', () => {
    it('should inclue dataStore configuration when dataStore is enabled', async () => {
      isDataStoreEnabledMocked.mockResolvedValue(true);
      await run(context, 'PostPull');
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            appId: 'testAppId',
            environmentName: 'testEnvName',
            codegenJobToCreate: expect.objectContaining({
              renderConfig: {
                react: expect.objectContaining({
                  apiConfiguration: {
                    dataStoreConfig: {},
                  },
                }),
              },
            }),
          },
        }),
      );
    });

    it('should inclue GraphQL configuration when dataStore is disabled and valid api configuration is found', async () => {
      isDataStoreEnabledMocked.mockResolvedValue(false);

      await run(context, 'PostPull');
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            appId: 'testAppId',
            environmentName: 'testEnvName',
            codegenJobToCreate: expect.objectContaining({
              renderConfig: {
                react: expect.objectContaining({
                  apiConfiguration: {
                    graphQLConfig: {
                      fragmentsFilePath: '../graphql/fragments.js',
                      mutationsFilePath: '../graphql/mutations.js',
                      queriesFilePath: '../graphql/queries.js',
                      subscriptionsFilePath: '../graphql/subscriptions.js',
                      typesFilePath: '',
                    },
                  },
                }),
              },
            }),
          },
        }),
      );
    });

    it('should include dependencies', async () => {
      isDataStoreEnabledMocked.mockResolvedValue(false);
      await run(context, 'PostPull');
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            appId: 'testAppId',
            environmentName: 'testEnvName',
            codegenJobToCreate: expect.objectContaining({
              renderConfig: {
                react: expect.objectContaining({
                  dependencies: { '@aws-amplify/ui-react': '4.6.0', 'aws-amplify': '^5.0.2', '@aws-amplify/ui-react-storage': '^1.2.0' },
                }),
              },
            }),
          },
        }),
      );
    });

    it('should inclue noApi configuration when dataStore is disabled and no valid GraphQL Api', async () => {
      isDataStoreEnabledMocked.mockResolvedValue(false);
      getCodegenConfigMocked.mockImplementation(() => {
        throw new Error();
      });
      await run(context, 'PostPull');
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            appId: 'testAppId',
            environmentName: 'testEnvName',
            codegenJobToCreate: expect.objectContaining({
              renderConfig: {
                react: expect.objectContaining({
                  apiConfiguration: {
                    noApiConfig: {},
                  },
                }),
              },
            }),
          },
        }),
      );
    });
  });
});
