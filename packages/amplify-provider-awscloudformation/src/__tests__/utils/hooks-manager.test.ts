import * as path from 'path';
import {
  pathManager, stateManager, $TSContext, skipHooks,
} from 'amplify-cli-core';
import fsExt from 'fs-extra';
import * as aws from 'aws-sdk';
import { S3 } from '../../aws-utils/aws-s3';
import {
  uploadHooksDirectory, downloadHooks, pullHooks, S3_HOOKS_DIRECTORY,
} from '../../utils/hooks-manager';

const testProjectRootPath = path.join('testProjectRootPath');
const testProjectHooksDirPath = path.join(testProjectRootPath, 'testProjectHooksDirPath');
const testProjectHooksFiles = ['dir1/file1-1', 'dir2/file2-1', 'file1', 'file2', 'hooks-config.json'];

jest.mock('amplify-cli-core');

jest.mock('../../aws-utils/aws-s3');

pathManager.findProjectRoot = jest.fn().mockReturnValue(testProjectRootPath);
pathManager.getHooksDirPath = jest.fn().mockReturnValue(testProjectHooksDirPath);
stateManager.getHooksConfigJson = jest.fn().mockReturnValue({ ignore: ['dir2/', 'file2'] });
const skipHooksMock = skipHooks as jest.MockedFunction<typeof skipHooks>;
skipHooksMock.mockReturnValue(false);

const bucketName = 'test-bucket';
const S3ListObjectsMockReturn = { Contents: [{ Key: 'hooks/file1' }, { Key: 'hooks/file2' }, { Key: 'hooks/file3' }] };

const s3Mock = S3 as jest.Mocked<typeof S3>;
const s3MockInstance = {
  deleteDirectory: jest.fn(),
  uploadFile: jest.fn(),
  getAllObjectVersions: jest.fn().mockResolvedValue(S3ListObjectsMockReturn.Contents),
  getFile: jest.fn().mockResolvedValue('test data'),
} as unknown as S3;
s3Mock.getInstance.mockResolvedValue(s3MockInstance);

stateManager.getMeta = jest.fn().mockReturnValue({
  providers: {
    awscloudformation: { DeploymentBucketName: bucketName },
  },
});

const awsCredentials = {
  accessKeyId: 'TestAmplifyContextAccessKeyId',
  secretAccessKey: 'TestAmplifyContextsSecretAccessKey',
};

const mockContext = ({
  exeInfo: {
    localEnvInfo: { projectPath: testProjectRootPath },
    region: 'TestAmplifyContextRegion',
    config: awsCredentials,
    inputParams: {
      amplify: {
        appId: 'TestAmplifyContextAppId',
      },
    },
  },
  amplify: {
    getEnvInfo: jest.fn().mockReturnValue({ envName: 'test-env' }),
    getProjectDetails: jest
      .fn()
      .mockReturnValue({ teamProviderInfo: { 'test-env': { awscloudformation: { DeploymentBucketName: bucketName } } } }),
  },
} as unknown) as $TSContext;

const mockS3Instance = {
  listObjects: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue(S3ListObjectsMockReturn),
  }),
  getObject: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({ Body: 'test data' }),
  }),
  promise: jest.fn().mockReturnThis(),
  catch: jest.fn(),
};

const isTestProjectSubPath = (childPath: string): boolean => {
  const relativePath = path.relative(testProjectRootPath, childPath);
  return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
};

jest.mock('amplify-cli-core');
jest.mock('glob', () => {
  const actualGlob = jest.requireActual('glob');
  return {
    ...({ ...actualGlob }),
    sync: jest.fn().mockImplementation((pattern, options) => {
      if (`${testProjectHooksDirPath}/**/*` === pattern) {
        return testProjectHooksFiles.map(filename => path.join(testProjectHooksDirPath, filename));
      }
      return actualGlob.sync(pattern, options);
    }),
  };
});
jest.mock('fs-extra', () => {
  const actualFs = jest.requireActual('fs-extra');
  return {
    ...({ ...actualFs }),
    existsSync: jest.fn().mockImplementation(pathStr => {
      if (isTestProjectSubPath(pathStr)) {
        return true;
      }
      return actualFs.existsSync(pathStr);
    }),
    lstatSync: jest.fn().mockImplementation(pathStr => {
      if (testProjectHooksFiles.includes(path.relative(testProjectHooksDirPath, pathStr))) {
        return { isFile: jest.fn().mockReturnValue(true) };
      }
      return actualFs.lstatSync(path);
    }),
    createReadStream: jest.fn().mockImplementation((pathStr, options) => {
      if (testProjectHooksFiles.includes(path.relative(testProjectHooksDirPath, pathStr))) {
        // eslint-disable-next-line spellcheck/spell-checker
        return 'testdata';
      }
      return actualFs.createReadStream(path, options);
    }),
    writeFileSync: jest.fn(),
    ensureFileSync: jest.fn(),
  };
});
jest.mock('aws-sdk', () => ({ S3: jest.fn(() => mockS3Instance) }));

describe('test hooks-manager', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });
  afterEach(() => { /* noop */ });

  test('uploadHooksDirectory test', async () => {
    const file1Name = 'file1';
    const file11Name = 'file1-1';
    const dir1Name = 'dir1';

    await uploadHooksDirectory(mockContext);
    expect(s3MockInstance.deleteDirectory).toHaveBeenCalledTimes(1);
    expect(s3MockInstance.deleteDirectory).toHaveBeenCalledWith(bucketName, S3_HOOKS_DIRECTORY);
    expect(s3MockInstance.uploadFile).toHaveBeenCalledTimes(3);

    expect(s3MockInstance.uploadFile).toHaveBeenNthCalledWith(1, {
      Body: expect.anything(),
      Key: `${S3_HOOKS_DIRECTORY + dir1Name}/${file11Name}`,
    });
    expect(s3MockInstance.uploadFile).toHaveBeenNthCalledWith(2, {
      Body: expect.anything(),
      Key: S3_HOOKS_DIRECTORY + file1Name,
    });
    expect(s3MockInstance.uploadFile).toHaveBeenNthCalledWith(3, {
      Body: expect.anything(),
      Key: `${S3_HOOKS_DIRECTORY}hooks-config.json`,
    });
  });

  test('downloadHooks test', async () => {
    await downloadHooks(mockContext, { deploymentArtifacts: bucketName }, { credentials: awsCredentials });

    const mockAwsS3 = new aws.S3();
    expect(mockAwsS3.listObjects).toHaveBeenCalledTimes(1);
    expect(mockAwsS3.listObjects).toHaveBeenCalledWith({ Prefix: S3_HOOKS_DIRECTORY, Bucket: bucketName });
    expect(mockAwsS3.getObject).toHaveBeenCalledTimes(S3ListObjectsMockReturn.Contents.length);
    expect(fsExt.writeFileSync).toHaveBeenCalledTimes(3);
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(1, path.join(testProjectHooksDirPath, 'file1'), expect.anything());
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(2, path.join(testProjectHooksDirPath, 'file2'), expect.anything());
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(3, path.join(testProjectHooksDirPath, 'file3'), expect.anything());
  });

  test('pullHooks test', async () => {
    await pullHooks(mockContext);

    expect(s3MockInstance.getAllObjectVersions).toHaveBeenCalledTimes(1);
    expect(s3MockInstance.getAllObjectVersions).toHaveBeenCalledWith(bucketName, { Prefix: S3_HOOKS_DIRECTORY });
    expect(s3MockInstance.getFile).toHaveBeenCalledTimes(S3ListObjectsMockReturn.Contents.length);
    expect(fsExt.writeFileSync).toHaveBeenCalledTimes(3);
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(1, path.join(testProjectHooksDirPath, 'file1'), expect.anything());
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(2, path.join(testProjectHooksDirPath, 'file2'), expect.anything());
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(3, path.join(testProjectHooksDirPath, 'file3'), expect.anything());
  });
});
