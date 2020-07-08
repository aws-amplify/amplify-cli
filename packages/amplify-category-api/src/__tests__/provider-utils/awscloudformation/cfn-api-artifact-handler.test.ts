import path from 'path';
import fs from 'fs-extra';
import { ApiArtifactHandler } from '../../../provider-utils/api-artifact-handler';
import { getCfnApiArtifactHandler } from '../../../provider-utils/awscloudformation/cfn-api-artifact-handler';
import { AddApiRequest } from 'amplify-headless-interface/src';
import { category } from '../../../category-constants';
import { writeTransformerConfiguration } from 'graphql-transformer-core';
import { rootAssetDir } from '../../../provider-utils/awscloudformation/aws-constants';

jest.mock('fs-extra');

jest.mock('graphql-transformer-core', () => ({
  readTransformerConfiguration: jest.fn(async () => ({})),
  writeTransformerConfiguration: jest.fn(),
}));

const fs_mock = (fs as unknown) as jest.Mocked<typeof fs>;
const writeTransformerConfiguration_mock = writeTransformerConfiguration as jest.MockedFunction<typeof writeTransformerConfiguration>;
const backendDirPathStub = 'backendDirPath';

const context_stub = {
  print: {
    success: jest.fn(),
  },
  amplify: {
    updateamplifyMetaAfterResourceAdd: jest.fn(),
    executeProviderUtils: jest.fn(),
    copyBatch: jest.fn(),
    pathManager: {
      getBackendDirPath: jest.fn(() => backendDirPathStub),
    },
  },
};

const request_stub: AddApiRequest = {
  version: 1,
  serviceConfiguration: {
    serviceName: 'AppSync',
    apiName: 'testApiName',
    transformSchema: 'my test schema',
    defaultAuthType: {
      mode: 'API_KEY',
      expirationTime: 10,
      keyDescription: 'api key description',
    },
  },
};

describe('create artifacts', () => {
  let cfnApiArtifactHandler: ApiArtifactHandler;
  beforeAll(() => {
    fs_mock.existsSync.mockImplementation(() => false);
  });
  beforeEach(() => {
    jest.clearAllMocks();
    cfnApiArtifactHandler = getCfnApiArtifactHandler(context_stub);
  });
  it('creates the correct directories', async () => {
    await cfnApiArtifactHandler.createArtifacts(request_stub);
    expect(fs_mock.ensureDirSync.mock.calls.length).toBe(1);
    expect(fs_mock.ensureDirSync.mock.calls[0][0]).toBe(path.join(backendDirPathStub, category, 'testApiName'));
    expect(fs_mock.mkdirSync.mock.calls.length).toBe(2);
    expect(fs_mock.mkdirSync.mock.calls[0][0]).toBe(path.join(backendDirPathStub, category, 'testApiName', 'resolvers'));
    expect(fs_mock.mkdirSync.mock.calls[1][0]).toBe(path.join(backendDirPathStub, category, 'testApiName', 'stacks'));
  });

  it('creates the transform.conf.json file', async () => {
    await cfnApiArtifactHandler.createArtifacts(request_stub);
    expect(writeTransformerConfiguration_mock.mock.calls.length).toBe(2);
    expect(writeTransformerConfiguration_mock.mock.calls[0]).toMatchSnapshot();
  });

  it('writes the default custom resources stack', async () => {
    await cfnApiArtifactHandler.createArtifacts(request_stub);
    expect(fs_mock.copyFileSync.mock.calls.length).toBe(1);
    expect(fs_mock.copyFileSync.mock.calls[0]).toEqual([
      path.join(rootAssetDir, 'cloudformation-templates', 'defaultCustomResources.json'),
      path.join(backendDirPathStub, category, request_stub.serviceConfiguration.apiName, 'stacks', 'CustomResources.json'),
    ]);
  });

  it('writes the selected template schema to project', async () => {
    await cfnApiArtifactHandler.createArtifacts(request_stub);
    expect(fs_mock.writeFileSync.mock.calls.length).toBe(1);
    expect(fs_mock.writeFileSync.mock.calls[0]).toEqual([
      path.join(backendDirPathStub, category, request_stub.serviceConfiguration.apiName, 'schema.graphql'),
      request_stub.serviceConfiguration.transformSchema,
    ]);
  });

  it('executes compileSchema from the provider', async () => {
    await cfnApiArtifactHandler.createArtifacts(request_stub);
    expect(context_stub.amplify.executeProviderUtils.mock.calls.length).toBe(1);
    expect(context_stub.amplify.executeProviderUtils.mock.calls[0][0]).toStrictEqual(context_stub);
    expect(context_stub.amplify.executeProviderUtils.mock.calls[0][1]).toStrictEqual('awscloudformation');
    expect(context_stub.amplify.executeProviderUtils.mock.calls[0][2]).toStrictEqual('compileSchema');
  });

  it('updates amplify meta', async () => {
    await cfnApiArtifactHandler.createArtifacts(request_stub);
    expect(context_stub.amplify.updateamplifyMetaAfterResourceAdd.mock.calls.length).toBe(1);
    expect(context_stub.amplify.updateamplifyMetaAfterResourceAdd.mock.calls[0][0]).toStrictEqual(category);
    expect(context_stub.amplify.updateamplifyMetaAfterResourceAdd.mock.calls[0][1]).toStrictEqual(
      request_stub.serviceConfiguration.apiName,
    );
  });

  it('returns the api name', async () => {
    const result = await cfnApiArtifactHandler.createArtifacts(request_stub);
    expect(result).toBe(request_stub.serviceConfiguration.apiName);
  });
});
