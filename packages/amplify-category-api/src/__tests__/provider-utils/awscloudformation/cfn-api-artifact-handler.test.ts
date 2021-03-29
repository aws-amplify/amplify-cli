import path from 'path';
import fs from 'fs-extra';
import { ApiArtifactHandler } from '../../../provider-utils/api-artifact-handler';
import { getCfnApiArtifactHandler } from '../../../provider-utils/awscloudformation/cfn-api-artifact-handler';
import { AddApiRequest, UpdateApiRequest } from 'amplify-headless-interface';
import { category } from '../../../category-constants';
import { writeTransformerConfiguration } from 'graphql-transformer-core';
import { rootAssetDir } from '../../../provider-utils/awscloudformation/aws-constants';
import {
  getAppSyncResourceName,
  getAppSyncAuthConfig,
  authConfigHasApiKey,
} from '../../../provider-utils/awscloudformation/utils/amplify-meta-utils';
import _ from 'lodash';

jest.mock('fs-extra');

jest.mock('graphql-transformer-core', () => ({
  readTransformerConfiguration: jest.fn(async () => ({})),
  writeTransformerConfiguration: jest.fn(),
}));

jest.mock('../../../provider-utils/awscloudformation/utils/amplify-meta-utils', () => ({
  checkIfAuthExists: jest.fn(),
  getAppSyncResourceName: jest.fn(() => testApiName),
  getAppSyncAuthConfig: jest.fn(() => ({})),
  authConfigHasApiKey: jest.fn(() => true),
  getImportedAuthUserPoolId: jest.fn(() => undefined),
}));

const fs_mock = (fs as unknown) as jest.Mocked<typeof fs>;
const writeTransformerConfiguration_mock = writeTransformerConfiguration as jest.MockedFunction<typeof writeTransformerConfiguration>;
const getAppSyncResourceName_mock = getAppSyncResourceName as jest.MockedFunction<typeof getAppSyncResourceName>;
const getAppSyncAuthConfig_mock = getAppSyncAuthConfig as jest.MockedFunction<typeof getAppSyncAuthConfig>;
const authConfigHasApiKey_mock = authConfigHasApiKey as jest.MockedFunction<typeof authConfigHasApiKey>;

const backendDirPathStub = 'backendDirPath';

const testApiName = 'testApiName';

const context_stub = {
  print: {
    success: jest.fn(),
    warning: jest.fn(),
  },
  amplify: {
    updateamplifyMetaAfterResourceAdd: jest.fn(),
    updateamplifyMetaAfterResourceUpdate: jest.fn(),
    updateBackendConfigAfterResourceUpdate: jest.fn(),
    executeProviderUtils: jest.fn(),
    copyBatch: jest.fn(),
    getProjectMeta: jest.fn(),
    readJsonFile: jest.fn(),
    pathManager: {
      getBackendDirPath: jest.fn(() => backendDirPathStub),
    },
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
    fs_mock.existsSync.mockImplementation(() => false);
    getAppSyncResourceName_mock.mockImplementation(() => undefined);
  });
  beforeEach(() => {
    jest.clearAllMocks();
    cfnApiArtifactHandler = getCfnApiArtifactHandler(context_stub);
  });

  it('does not create a second API if one already exists', async () => {
    getAppSyncResourceName_mock.mockImplementationOnce(() => testApiName);
    return expect(cfnApiArtifactHandler.createArtifacts(addRequestStub)).rejects.toMatchInlineSnapshot(
      `[Error: GraphQL API testApiName already exists in the project. Use 'amplify update api' to make modifications.]`,
    );
  });

  it('creates the correct directories', async () => {
    await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(fs_mock.ensureDirSync.mock.calls.length).toBe(1);
    expect(fs_mock.ensureDirSync.mock.calls[0][0]).toBe(path.join(backendDirPathStub, category, testApiName));
    expect(fs_mock.mkdirSync.mock.calls.length).toBe(2);
    expect(fs_mock.mkdirSync.mock.calls[0][0]).toBe(path.join(backendDirPathStub, category, testApiName, 'resolvers'));
    expect(fs_mock.mkdirSync.mock.calls[1][0]).toBe(path.join(backendDirPathStub, category, testApiName, 'stacks'));
  });

  it('creates the transform.conf.json file', async () => {
    await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(writeTransformerConfiguration_mock.mock.calls.length).toBe(2);
    expect(writeTransformerConfiguration_mock.mock.calls[0]).toMatchSnapshot();
  });

  it('writes the default custom resources stack', async () => {
    await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(fs_mock.copyFileSync.mock.calls.length).toBe(2);
    expect(fs_mock.copyFileSync.mock.calls[1]).toEqual([
      path.join(rootAssetDir, 'cloudformation-templates', 'defaultCustomResources.json'),
      path.join(backendDirPathStub, category, addRequestStub.serviceConfiguration.apiName, 'stacks', 'CustomResources.json'),
    ]);
  });

  it('writes the selected template schema to project', async () => {
    await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(fs_mock.writeFileSync.mock.calls.length).toBe(1);
    expect(fs_mock.writeFileSync.mock.calls[0]).toEqual([
      path.join(backendDirPathStub, category, addRequestStub.serviceConfiguration.apiName, 'schema.graphql'),
      addRequestStub.serviceConfiguration.transformSchema,
    ]);
  });

  it('executes compileSchema from the provider', async () => {
    await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(context_stub.amplify.executeProviderUtils.mock.calls.length).toBe(1);
    expect(context_stub.amplify.executeProviderUtils.mock.calls[0][0]).toStrictEqual(context_stub);
    expect(context_stub.amplify.executeProviderUtils.mock.calls[0][1]).toStrictEqual('awscloudformation');
    expect(context_stub.amplify.executeProviderUtils.mock.calls[0][2]).toStrictEqual('compileSchema');
  });

  it('updates amplify meta', async () => {
    await cfnApiArtifactHandler.createArtifacts(addRequestStub);
    expect(context_stub.amplify.updateamplifyMetaAfterResourceAdd.mock.calls.length).toBe(1);
    expect(context_stub.amplify.updateamplifyMetaAfterResourceAdd.mock.calls[0][0]).toStrictEqual(category);
    expect(context_stub.amplify.updateamplifyMetaAfterResourceAdd.mock.calls[0][1]).toStrictEqual(
      addRequestStub.serviceConfiguration.apiName,
    );
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
    getAppSyncResourceName_mock.mockImplementation(() => testApiName);
    getAppSyncAuthConfig_mock.mockImplementation(() => ({
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
    cfnApiArtifactHandler = getCfnApiArtifactHandler(context_stub);
  });

  it('throws error if no GQL API in project', () => {
    getAppSyncResourceName_mock.mockImplementationOnce(() => undefined);
    return expect(cfnApiArtifactHandler.updateArtifacts(updateRequestStub)).rejects.toMatchInlineSnapshot(
      `[Error: No AppSync API configured in the project. Use 'amplify add api' to create an API.]`,
    );
  });

  it('writes new schema if specified', async () => {
    const newSchemaContents = 'a new schema';
    updateRequestStub.serviceModification.transformSchema = newSchemaContents;
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(fs_mock.writeFileSync.mock.calls.length).toBe(1);
    expect(fs_mock.writeFileSync.mock.calls[0][1]).toBe(newSchemaContents);
  });

  it('updates resolver config if not empty', async () => {
    updateRequestStub.serviceModification.conflictResolution = {
      defaultResolutionStrategy: {
        type: 'OPTIMISTIC_CONCURRENCY',
      },
    };
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(writeTransformerConfiguration_mock.mock.calls.length).toBe(1);
  });

  it('updates default auth if not empty', async () => {
    updateRequestStub.serviceModification.defaultAuthType = { mode: 'AWS_IAM' };
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(context_stub.amplify.executeProviderUtils.mock.calls.length).toBe(1);
    expect(context_stub.amplify.executeProviderUtils.mock.calls[0][3].authConfig).toMatchSnapshot();
  });

  it('updates additional auth if not empty', async () => {
    updateRequestStub.serviceModification.additionalAuthTypes = [{ mode: 'AWS_IAM' }, { mode: 'API_KEY' }];
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(context_stub.amplify.executeProviderUtils.mock.calls.length).toBe(1);
    expect(context_stub.amplify.executeProviderUtils.mock.calls[0][3].authConfig).toMatchSnapshot();
  });

  it('compiles the changes', async () => {
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(context_stub.amplify.executeProviderUtils.mock.calls.length).toBe(1);
  });

  it('updates meta files after update', async () => {
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(context_stub.amplify.updateamplifyMetaAfterResourceUpdate.mock.calls.length).toBe(1);
    expect(context_stub.amplify.updateBackendConfigAfterResourceUpdate.mock.calls.length).toBe(1);
  });

  it('prints warning when adding API key auth', async () => {
    authConfigHasApiKey_mock.mockImplementationOnce(() => false).mockImplementationOnce(() => true);
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(context_stub.print.warning.mock.calls.length).toBe(2);
  });

  it('prints warning when removing API key auth', async () => {
    authConfigHasApiKey_mock.mockImplementationOnce(() => true).mockImplementationOnce(() => false);
    await cfnApiArtifactHandler.updateArtifacts(updateRequestStub);
    expect(context_stub.print.warning.mock.calls.length).toBe(3);
  });
});
