import { $TSContext, pathManager } from 'amplify-cli-core';
import { AddApiRequest, UpdateApiRequest } from 'amplify-headless-interface';
import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import { writeTransformerConfiguration } from 'graphql-transformer-core';
import _ from 'lodash';
import * as path from 'path';
import { AppsyncApiInputState } from '../../../provider-utils/awscloudformation/api-input-manager/appsync-api-input-state';
import { category } from '../../../category-constants';
import { ApiArtifactHandler } from '../../../provider-utils/api-artifact-handler';
import { rootAssetDir } from '../../../provider-utils/awscloudformation/aws-constants';
import { getCfnApiArtifactHandler } from '../../../provider-utils/awscloudformation/cfn-api-artifact-handler';
import {
  authConfigHasApiKey,
  getAppSyncAuthConfig,
  getAppSyncResourceName,
} from '../../../provider-utils/awscloudformation/utils/amplify-meta-utils';

const testAuthId = 'testAuthId';

jest.mock('fs-extra');
const printerMock = printer as jest.Mocked<typeof printer>;
printerMock.warn = jest.fn();

jest.mock('../../../provider-utils/awscloudformation/api-input-manager/appsync-api-input-state');

jest.mock('graphql-transformer-core', () => ({
  readTransformerConfiguration: jest.fn(async () => ({})),
  writeTransformerConfiguration: jest.fn(),
}));

jest.mock('../../../provider-utils/awscloudformation/utils/amplify-meta-utils', () => ({
  checkIfAuthExists: jest.fn().mockImplementation(() => testAuthId),
  getAppSyncResourceName: jest.fn(() => testApiName),
  getAppSyncAuthConfig: jest.fn(() => ({})),
  authConfigHasApiKey: jest.fn(() => true),
  getImportedAuthUserPoolId: jest.fn(() => undefined),
}));

jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockBackendDirPath'),
    findProjectRoot: jest.fn().mockReturnValue('mockProject'),
  },
  stateManager: {
    getMeta: jest.fn().mockReturnValue({}),
    getBackendConfig: jest.fn(),
  },
  AmplifyCategories: {
    API: 'api',
  },
  AmplifySupportedService: {
    APPSYNC: 'Appsync',
  },
  JSONUtilities: {
    readJson: jest.fn(),
    writeJson: jest.fn(),
  },
  isResourceNameUnique: jest.fn(),
}));

const backendDirPathStub = 'backendDirPath';
const testApiName = 'testApiName';

const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
pathManagerMock.getResourceDirectoryPath = jest.fn().mockReturnValue(`${backendDirPathStub}/api/${testApiName}`);

const fsMock = (fs as unknown) as jest.Mocked<typeof fs>;
const writeTransformerConfigurationMock = writeTransformerConfiguration as jest.MockedFunction<typeof writeTransformerConfiguration>;
const getAppSyncResourceNameMock = getAppSyncResourceName as jest.MockedFunction<typeof getAppSyncResourceName>;
const getAppSyncAuthConfigMock = getAppSyncAuthConfig as jest.MockedFunction<typeof getAppSyncAuthConfig>;
const authConfigHasApiKeyMock = authConfigHasApiKey as jest.MockedFunction<typeof authConfigHasApiKey>;

const contextStub = {
  amplify: {
    updateamplifyMetaAfterResourceAdd: jest.fn(),
    updateamplifyMetaAfterResourceUpdate: jest.fn(),
    updateBackendConfigAfterResourceUpdate: jest.fn(),
    executeProviderUtils: jest.fn(),
    copyBatch: jest.fn(),
  },
};

describe('create artifacts', () => {
  let cfnApiArtifactHandler: ApiArtifactHandler;
  const addRequestStub: AddApiRequest = {
    version: 1,
    serviceConfiguration: {
      serviceName: 'AppSync',
      apiName: testApiName,
      transformSchema: 'my test schema',
      defaultAuthType: {
        mode: 'API_KEY',
        expirationTime: 10,
        keyDescription: 'api key description',
      },
    },
  };
  beforeAll(() => {
    fsMock.existsSync.mockImplementation(() => false);
    getAppSyncResourceNameMock.mockImplementation(() => undefined);
  });
  beforeEach(() => {
    jest.clearAllMocks();
    cfnApiArtifactHandler = getCfnApiArtifactHandler((contextStub as unknown) as $TSContext);
  });

  it('does not create a second API if one already exists', async () => {
    getAppSyncResourceNameMock.mockImplementationOnce(() => testApiName);
    return expect(cfnApiArtifactHandler.createArtifacts(addRequestStub)).rejects.toMatchInlineSnapshot(
      "[Error: GraphQL API testApiName already exists in the project. Use 'amplify update api' to make modifications.]",
    );
  });

  it('creates the correct directories', async () => {
    await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(fsMock.ensureDirSync.mock.calls.length).toBe(1);
    expect(fsMock.ensureDirSync.mock.calls[0][0]).toBe(path.join(backendDirPathStub, category, testApiName));
    expect(fsMock.mkdirSync.mock.calls.length).toBe(2);
    expect(fsMock.mkdirSync.mock.calls[0][0]).toBe(path.join(backendDirPathStub, category, testApiName, 'resolvers'));
    expect(fsMock.mkdirSync.mock.calls[1][0]).toBe(path.join(backendDirPathStub, category, testApiName, 'stacks'));
  });

  it('creates the transform.conf.json file', async () => {
    await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(writeTransformerConfigurationMock.mock.calls.length).toBe(2);
    expect(writeTransformerConfigurationMock.mock.calls[0]).toMatchSnapshot();
  });

  it('writes the default custom resources stack', async () => {
    await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(fsMock.copyFileSync.mock.calls.length).toBe(2);
    expect(fsMock.copyFileSync.mock.calls[1]).toEqual([
      path.join(rootAssetDir, 'cloudformation-templates', 'defaultCustomResources.json'),
      path.join(backendDirPathStub, category, addRequestStub.serviceConfiguration.apiName, 'stacks', 'CustomResources.json'),
    ]);
  });

  it('creates correct cli-inputs', async () => {
    jest.spyOn(AppsyncApiInputState.prototype, 'saveCLIInputPayload');
    await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(AppsyncApiInputState.prototype.saveCLIInputPayload).toBeCalledWith({
      serviceConfiguration: {
        apiName: 'testApiName',
        defaultAuthType: { expirationTime: 10, keyDescription: 'api key description', mode: 'API_KEY' },
        gqlSchemaPath: 'backendDirPath/api/testApiName/schema.graphql',
        serviceName: 'AppSync',
      },
      version: 1,
    });
  });

  it('writes the selected template schema to project', async () => {
    await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(fsMock.writeFileSync.mock.calls.length).toBe(1);
    expect(fsMock.writeFileSync.mock.calls[0]).toEqual([
      path.join(backendDirPathStub, category, addRequestStub.serviceConfiguration.apiName, 'schema.graphql'),
      addRequestStub.serviceConfiguration.transformSchema,
    ]);
  });

  it('executes compileSchema from the provider', async () => {
    await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(contextStub.amplify.executeProviderUtils.mock.calls.length).toBe(1);
    expect(contextStub.amplify.executeProviderUtils.mock.calls[0][0]).toStrictEqual(contextStub);
    expect(contextStub.amplify.executeProviderUtils.mock.calls[0][1]).toStrictEqual('awscloudformation');
    expect(contextStub.amplify.executeProviderUtils.mock.calls[0][2]).toStrictEqual('compileSchema');
  });

  it('updates amplify meta', async () => {
    await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceAdd.mock.calls.length).toBe(1);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceAdd.mock.calls[0][0]).toStrictEqual(category);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceAdd.mock.calls[0][1]).toStrictEqual(
      addRequestStub.serviceConfiguration.apiName,
    );
  });

  it('updates amplify meta with depends on auth if cognito specified', async () => {
    const addRequestStubCognito = _.cloneDeep(addRequestStub);
    addRequestStubCognito.serviceConfiguration.defaultAuthType = {
      mode: 'AMAZON_COGNITO_USER_POOLS',
      cognitoUserPoolId: testAuthId,
    };
    await cfnApiArtifactHandler.createArtifacts(addRequestStubCognito);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceAdd).toHaveBeenCalledTimes(1);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceAdd.mock.calls[0][2].dependsOn).toEqual([
      {
        category: 'auth',
        resourceName: testAuthId,
        attributes: ['UserPoolId'],
      },
    ]);
  });

  it('returns the api name', async () => {
    const result = await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(result).toBe(addRequestStub.serviceConfiguration.apiName);
  });
});

describe('update artifacts', () => {
  let cfnApiArtifactHandler: ApiArtifactHandler;
  let updateRequestStub: UpdateApiRequest;
  const updateRequestStubBase: UpdateApiRequest = {
    version: 1,
    serviceModification: {
      serviceName: 'AppSync',
    },
  };

  beforeAll(() => {
    getAppSyncResourceNameMock.mockImplementation(() => testApiName);
    getAppSyncAuthConfigMock.mockImplementation(() => ({
      defaultAuthentication: {
        authenticationType: 'API_KEY',
        apiKeyConfig: {
          apiKeyExpirationDays: 7,
          description: '',
        },
      },
      additionalAuthenticationProviders: [
        {
          authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          userPoolConfig: {
            userPoolId: 'myUserPoolId',
          },
        },
      ],
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    updateRequestStub = _.cloneDeep(updateRequestStubBase);
    cfnApiArtifactHandler = getCfnApiArtifactHandler((contextStub as unknown) as $TSContext);
  });

  it('throws error if no GQL API in project', () => {
    getAppSyncResourceNameMock.mockImplementationOnce(() => undefined);
    return expect(cfnApiArtifactHandler.updateArtifacts(updateRequestStub)).rejects.toMatchInlineSnapshot(
      "[Error: No AppSync API configured in the project. Use 'amplify add api' to create an API.]",
    );
  });

  it('writes new schema if specified', async () => {
    const newSchemaContents = 'a new schema';
    updateRequestStub.serviceModification.transformSchema = newSchemaContents;
    jest.spyOn(AppsyncApiInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      serviceConfiguration: {
        apiName: 'testApiName',
        defaultAuthType: { expirationTime: 10, keyDescription: 'api key description', mode: 'API_KEY' },
        gqlSchemaPath: 'backendDirPath/api/testApiName/schema.graphql',
        serviceName: 'AppSync',
      },
      version: 1,
    });
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(fsMock.writeFileSync.mock.calls.length).toBe(1);
    expect(fsMock.writeFileSync.mock.calls[0][1]).toBe(newSchemaContents);
  });

  it('updates default auth if not empty', async () => {
    updateRequestStub.serviceModification.defaultAuthType = { mode: 'AWS_IAM' };
    jest.spyOn(AppsyncApiInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      serviceConfiguration: {
        apiName: 'testApiName',
        defaultAuthType: { expirationTime: 10, keyDescription: 'api key description', mode: 'API_KEY' },
        gqlSchemaPath: 'backendDirPath/api/testApiName/schema.graphql',
        serviceName: 'AppSync',
      },
      version: 1,
    });
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(contextStub.amplify.executeProviderUtils.mock.calls.length).toBe(1);
    expect(contextStub.amplify.executeProviderUtils.mock.calls[0][3].authConfig).toMatchSnapshot();
  });

  it('updates correct cli-inputs', async () => {
    updateRequestStub.serviceModification.additionalAuthTypes = [{ mode: 'AWS_IAM' }, { mode: 'API_KEY' }];
    jest.spyOn(AppsyncApiInputState.prototype, 'saveCLIInputPayload');
    jest.spyOn(AppsyncApiInputState.prototype, 'cliInputFileExists').mockReturnValueOnce(true);
    jest.spyOn(AppsyncApiInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      serviceConfiguration: {
        apiName: 'testApiName',
        defaultAuthType: { expirationTime: 10, keyDescription: 'api key description', mode: 'API_KEY' },
        gqlSchemaPath: 'backendDirPath/api/testApiName/schema.graphql',
        serviceName: 'AppSync',
      },
      version: 1,
    });
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(AppsyncApiInputState.prototype.saveCLIInputPayload).toBeCalledWith({
      serviceConfiguration: {
        additionalAuthTypes: [{ mode: 'AWS_IAM' }, { mode: 'API_KEY' }],
        apiName: 'testApiName',
        defaultAuthType: { expirationTime: 10, keyDescription: 'api key description', mode: 'API_KEY' },
        gqlSchemaPath: 'backendDirPath/api/testApiName/schema.graphql',
        serviceName: 'AppSync',
      },
      version: 1,
    });
  });

  it('updates additional auth if not empty', async () => {
    updateRequestStub.serviceModification.additionalAuthTypes = [{ mode: 'AWS_IAM' }, { mode: 'API_KEY' }];
    jest.spyOn(AppsyncApiInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      serviceConfiguration: {
        apiName: 'testApiName',
        defaultAuthType: { expirationTime: 10, keyDescription: 'api key description', mode: 'API_KEY' },
        gqlSchemaPath: 'backendDirPath/api/testApiName/schema.graphql',
        serviceName: 'AppSync',
      },
      version: 1,
    });

    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(contextStub.amplify.executeProviderUtils.mock.calls.length).toBe(1);
    expect(contextStub.amplify.executeProviderUtils.mock.calls[0][3].authConfig).toMatchSnapshot();
  });

  it('compiles the changes', async () => {
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(contextStub.amplify.executeProviderUtils.mock.calls.length).toBe(1);
  });

  it('updates meta files after update', async () => {
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceUpdate.mock.calls.length).toBe(2);
    expect(contextStub.amplify.updateBackendConfigAfterResourceUpdate.mock.calls.length).toBe(2);
  });

  it('prints warning when adding API key auth', async () => {
    authConfigHasApiKeyMock.mockImplementationOnce(() => false).mockImplementationOnce(() => true);
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(printerMock.warn.mock.calls.length).toBe(2);
  });

  it('prints warning when removing API key auth', async () => {
    authConfigHasApiKeyMock.mockImplementationOnce(() => true).mockImplementationOnce(() => false);
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(printerMock.warn.mock.calls.length).toBe(3);
  });

  it('adds auth dependency if cognito auth specified', async () => {
    getAppSyncAuthConfigMock.mockReturnValueOnce({
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        userPoolConfig: {
          userPoolId: testAuthId,
        },
      },
    });
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceUpdate.mock.calls.length).toBe(2);
    expect(contextStub.amplify.updateamplifyMetaAfterResourceUpdate.mock.calls[1][3]).toEqual([
      {
        category: 'auth',
        resourceName: testAuthId,
        attributes: [
          'UserPoolId',
        ],
      },
    ]);
  });
});
