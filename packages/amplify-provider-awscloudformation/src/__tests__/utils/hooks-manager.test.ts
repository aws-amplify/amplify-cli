import * as path from 'path';
import { uploadHooksDirectory, downloadHooks, pullHooks, S3_HOOKS_DIRECTORY } from '../../utils/hooks-manager';
import { pathManager, stateManager, $TSContext, skipHooksFilePath } from 'amplify-cli-core';
import amplifyCliCore from 'amplify-cli-core';
import fsExt from 'fs-extra';
import { S3 } from '../../aws-utils/aws-s3';
import * as aws from 'aws-sdk';

const testProjectRootPath = path.join('testProjectRootPath');
const testProjectHooksDirPath = path.join(testProjectRootPath, 'testProjectHooksDirPath');
const testProjectHooksFiles = ['dir1/file1-1', 'dir2/file2-1', 'file1', 'file2', 'hooks-config.json'];

pathManager.findProjectRoot = jest.fn().mockReturnValue(testProjectRootPath);
pathManager.getHooksDirPath = jest.fn().mockReturnValue(testProjectHooksDirPath);
stateManager.getHooksConfigJson = jest.fn().mockReturnValue({ ignore: ['dir2/', 'file2'] });

const bucketName = 'test-bucket';
const S3ListObjectsMockReturn = { Contents: [{ Key: 'hooks/file1' }, { Key: 'hooks/file2' }, { Key: 'hooks/file3' }] };

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

let S3_mock_instance: S3;

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

const istestProjectSubPath = childPath => {
  const relativePath = path.relative(testProjectRootPath, childPath);
  return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
};

jest.mock('amplify-cli-core', () => ({ ...Object.assign({}, jest.requireActual('amplify-cli-core')) }));
jest.mock('glob', () => {
  const actualGlob = jest.requireActual('glob');
  return {
    ...Object.assign({}, actualGlob),
    sync: jest.fn().mockImplementation((pattern, options) => {
      if (testProjectHooksDirPath + '/**/*' === pattern) {
        return testProjectHooksFiles.map(filename => path.join(testProjectHooksDirPath, filename));
      }
      return actualGlob.sync(pattern, options);
    }),
  };
});
jest.mock('fs-extra', () => {
  const actualFs = jest.requireActual('fs-extra');
  return {
    ...Object.assign({}, actualFs),
    existsSync: jest.fn().mockImplementation(pathStr => {
      if (istestProjectSubPath(pathStr)) {
        return true;
      }
      return actualFs.existsSync(pathStr);
    }),
    lstatSync: jest.fn().mockImplementation(pathStr => {
      if (testProjectHooksFiles.includes(path.relative(testProjectHooksDirPath, pathStr)))
        return { isFile: jest.fn().mockReturnValue(true) };
      return actualFs.lstatSync(path);
    }),
    createReadStream: jest.fn().mockImplementation((pathStr, options) => {
      if (testProjectHooksFiles.includes(path.relative(testProjectHooksDirPath, pathStr))) {
        return 'testdata';
      }
      return actualFs.createReadStream(path, options);
    }),
    writeFileSync: jest.fn(),
    ensureFileSync: jest.fn(),
  };
});
jest.mock('aws-sdk', () => {
  return { S3: jest.fn(() => mockS3Instance) };
});
let mockSkipHooks = jest.spyOn(amplifyCliCore, 'skipHooks');
mockSkipHooks.mockImplementation((): boolean => {
  return false;
});

describe('test hooks-manager ', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    S3_mock_instance = await S3.getInstance(mockContext);
    jest.spyOn(S3_mock_instance, 'deleteDirectory').mockImplementation(
      (): Promise<void> => {
        return;
      },
    );
    jest.spyOn(S3_mock_instance, 'uploadFile').mockImplementation(
      (): Promise<string> => {
        return;
      },
    );
    jest.spyOn(S3_mock_instance, 'getAllObjectVersions').mockImplementation(
      (): Promise<Required<aws.S3.ObjectIdentifier>[]> => {
        return S3ListObjectsMockReturn.Contents as any;
      },
    );
    jest.spyOn(S3_mock_instance, 'getFile').mockImplementation(
      (): Promise<aws.S3.Body> => {
        return 'test data' as any;
      },
    );
  });
  afterEach(() => {});

  test('uploadHooksDirectory test', async () => {
    const file1Name = 'file1';
    const file11Name = 'file1-1';
    const dir1Name = 'dir1';

    await uploadHooksDirectory(mockContext);
    expect(S3_mock_instance.deleteDirectory).toHaveBeenCalledTimes(1);
    expect(S3_mock_instance.deleteDirectory).toHaveBeenCalledWith(bucketName, S3_HOOKS_DIRECTORY);
    expect(S3_mock_instance.uploadFile).toHaveBeenCalledTimes(3);

    expect(S3_mock_instance.uploadFile).toHaveBeenNthCalledWith(1, {
      Body: expect.anything(),
      Key: S3_HOOKS_DIRECTORY + dir1Name + '/' + file11Name,
    });
    expect(S3_mock_instance.uploadFile).toHaveBeenNthCalledWith(2, {
      Body: expect.anything(),
      Key: S3_HOOKS_DIRECTORY + file1Name,
    });
    expect(S3_mock_instance.uploadFile).toHaveBeenNthCalledWith(3, {
      Body: expect.anything(),
      Key: S3_HOOKS_DIRECTORY + 'hooks-config.json',
    });
  });

  test('downloadHooks test', async () => {
    await downloadHooks(mockContext, { deploymentArtifacts: bucketName }, { credentials: awsCredentials });

    const mockawsS3 = new aws.S3();
    expect(mockawsS3.listObjects).toHaveBeenCalledTimes(1);
    expect(mockawsS3.listObjects).toHaveBeenCalledWith({ Prefix: S3_HOOKS_DIRECTORY, Bucket: bucketName });
    expect(mockawsS3.getObject).toHaveBeenCalledTimes(S3ListObjectsMockReturn.Contents.length);
    expect(fsExt.writeFileSync).toHaveBeenCalledTimes(3);
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(1, path.join(testProjectHooksDirPath, 'file1'), expect.anything());
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(2, path.join(testProjectHooksDirPath, 'file2'), expect.anything());
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(3, path.join(testProjectHooksDirPath, 'file3'), expect.anything());
  });

  test('pullHooks test', async () => {
    await pullHooks(mockContext);

    expect(S3_mock_instance.getAllObjectVersions).toHaveBeenCalledTimes(1);
    expect(S3_mock_instance.getAllObjectVersions).toHaveBeenCalledWith(bucketName, { Prefix: S3_HOOKS_DIRECTORY });
    expect(S3_mock_instance.getFile).toHaveBeenCalledTimes(S3ListObjectsMockReturn.Contents.length);
    expect(fsExt.writeFileSync).toHaveBeenCalledTimes(3);
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(1, path.join(testProjectHooksDirPath, 'file1'), expect.anything());
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(2, path.join(testProjectHooksDirPath, 'file2'), expect.anything());
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(3, path.join(testProjectHooksDirPath, 'file3'), expect.anything());
  });
});
