import { $TSContext, stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import { adminModelgen } from '../admin-modelgen';
import { S3 } from '../aws-utils/aws-s3';

jest.mock('fs-extra');
jest.mock('../aws-utils/aws-s3');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('graphql-transformer-core');
jest.mock('../utils/admin-helpers');

const fsMock = fs as jest.Mocked<typeof fs>;
const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;

const originalProjectConfig = 'original project config';

stateManagerMock.getProjectConfig.mockReturnValue(originalProjectConfig);
stateManagerMock.getMeta.mockReturnValue({
  providers: {
    awscloudformation: {
      AmplifyAppId: 'testAppId',
    },
  },
});
pathManagerMock.findProjectRoot.mockReturnValue('mock/project/root');
pathManagerMock.getBackendDirPath.mockReturnValue('mock/backend/dir/path');
pathManagerMock.getResourceDirectoryPath.mockReturnValue('mock/resource/dir/path');
fsMock.createWriteStream.mockReturnValue({
  write: {
    bind: jest.fn(),
  },
  close: (cb: Function) => {
    cb();
  },
} as unknown as fs.WriteStream);
fsMock.createReadStream.mockImplementation((filePath) => `mock body of ${filePath}` as unknown as fs.ReadStream);

const s3FactoryMock = S3 as jest.Mocked<typeof S3>;

const s3Mock = {
  uploadFile: jest.fn(),
} as unknown as jest.Mocked<S3>;

s3FactoryMock.getInstance.mockResolvedValue(s3Mock as unknown as S3);

const apiName = 'testApiName';
const resources = [
  {
    service: 'Other',
    resourceName: 'testName',
  },
  {
    service: 'AppSync',
    resourceName: apiName,
  },
];

const invokePluginMock = jest.fn();

let contextStub: $TSContext;

beforeEach(() => {
  jest.clearAllMocks();
  contextStub = {
    amplify: {
      invokePluginMethod: invokePluginMock,
    },
  } as unknown as $TSContext;
});

it('invokes codegen functions and writes assets to S3', async () => {
  await adminModelgen(contextStub, resources);

  expect(invokePluginMock.mock.calls.length).toBe(2);
  expect(invokePluginMock.mock.calls[0][3]).toBe('generateModels');
  expect(invokePluginMock.mock.calls[1][3]).toBe('generateModelIntrospection');
  expect(s3Mock.uploadFile.mock.calls).toMatchInlineSnapshot(`
[
  [
    {
      "Body": "mock body of mock/resource/dir/path/schema.graphql",
      "Key": "models/testApiName/schema.graphql",
    },
    false,
  ],
  [
    {
      "Body": "mock body of mock/project/root/amplify-codegen-temp/models/schema.js",
      "Key": "models/testApiName/schema.js",
    },
    false,
  ],
  [
    {
      "Body": "mock body of mock/project/root/amplify-codegen-temp/model-introspection.json",
      "Key": "models/testApiName/modelIntrospection.json",
    },
    false,
  ],
]
`);
});

it('resets js config on error', async () => {
  invokePluginMock.mockRejectedValue(new Error('test error'));
  await expect(() => adminModelgen(contextStub, resources)).rejects.toThrowErrorMatchingInlineSnapshot(`"test error"`);
  expect(stateManagerMock.setProjectConfig.mock.calls.length).toBe(2);
  expect(stateManagerMock.setProjectConfig.mock.calls[1][1]).toBe(originalProjectConfig);
});

it('resets stdout on error', async () => {
  const initialStdoutWriter = process.stdout.write;
  invokePluginMock.mockRejectedValue(new Error('test error'));
  await expect(() => adminModelgen(contextStub, resources)).rejects.toThrowErrorMatchingInlineSnapshot(`"test error"`);
  expect(process.stdout.write).toBe(initialStdoutWriter);
});

it('removes temp dir on error', async () => {
  invokePluginMock.mockRejectedValue(new Error('test error'));
  await expect(adminModelgen(contextStub, resources)).rejects.toThrowErrorMatchingInlineSnapshot(`"test error"`);
  expect(fsMock.remove.mock.calls.length).toBe(1);
  expect(fsMock.remove.mock.calls[0][0]).toMatchInlineSnapshot(`"mock/project/root/amplify-codegen-temp"`);
});
