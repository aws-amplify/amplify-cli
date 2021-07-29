jest.mock('process');
jest.mock('amplify-cli-core', () => ({ ...Object.assign({}, jest.requireActual('amplify-cli-core')) }));
jest.mock('fs-extra');
const S3ListObjectsMockReturn = { Contents: [{ Key: 'hooks/file1' }, { Key: 'hooks/file2' }, { Key: 'hooks/file3' }] };

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

jest.mock('aws-sdk', () => {
  return { S3: jest.fn(() => mockS3Instance) };
});

import { uploadHooksDirectory, downloadHooks, pullHooks, S3_HOOKS_DIRECTORY } from '../../utils/hooks-manager';
import { pathManager, stateManager, $TSContext, skipHooksFileName, skipHooksFilePath } from 'amplify-cli-core';
import amplifyCliCore from 'amplify-cli-core';
import * as path from 'path';
import fsExt from 'fs-extra';
import { S3 } from '../../aws-utils/aws-s3';
import * as aws from 'aws-sdk';

const testProjectRootPath = path.join(__dirname, '..', 'testFiles', 'hooks-test-project');
const testProjectHooksDirPath = path.join(testProjectRootPath, 'amplify', 'hooks');
const testProjectHooksConfigPath = path.join(testProjectHooksDirPath, 'hooks-config.json');

const bucketName = 'test-bucket';
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

pathManager.findProjectRoot = jest.fn().mockReturnValue(testProjectRootPath);
pathManager.getHooksDirPath = jest.fn().mockReturnValue(testProjectHooksDirPath);
pathManager.getHooksConfigFilePath = jest.fn().mockReturnValue(testProjectHooksConfigPath);
stateManager.getHooksConfigJson = jest.requireActual('amplify-cli-core').stateManager.getHooksConfigJson;
const skipHooksMock = jest.spyOn(amplifyCliCore, 'skipHooks');
skipHooksMock.mockImplementation((): boolean => {
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

    // restoring some moked fs-extra functions
    const orgFsExt = jest.requireActual('fs-extra');
    fsExt.existsSync = orgFsExt.existsSync;
    fsExt.readFileSync = orgFsExt.readFileSync;
    fsExt.lstatSync = orgFsExt.lstatSync;
    fsExt.createReadStream = orgFsExt.createReadStream;

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
    // restoring some moked fs-extra functions
    const orgFsExt = jest.requireActual('fs-extra');
    fsExt.existsSync = orgFsExt.existsSync;
    fsExt.readFileSync = orgFsExt.readFileSync;
    fsExt.lstatSync = orgFsExt.lstatSync;
    fsExt.createReadStream = orgFsExt.createReadStream;

    await pullHooks(mockContext);

    expect(S3_mock_instance.getAllObjectVersions).toHaveBeenCalledTimes(1);
    expect(S3_mock_instance.getAllObjectVersions).toHaveBeenCalledWith(bucketName, { Prefix: S3_HOOKS_DIRECTORY });
    expect(S3_mock_instance.getFile).toHaveBeenCalledTimes(S3ListObjectsMockReturn.Contents.length);
    expect(fsExt.writeFileSync).toHaveBeenCalledTimes(3);
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(1, path.join(testProjectHooksDirPath, 'file1'), expect.anything());
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(2, path.join(testProjectHooksDirPath, 'file2'), expect.anything());
    expect(fsExt.writeFileSync).toHaveBeenNthCalledWith(3, path.join(testProjectHooksDirPath, 'file3'), expect.anything());
  });

  test('skiphooks test', async () => {
    skipHooksMock.mockRestore();
    // restoring some moked fs-extra functions
    const orgFsExt = jest.requireActual('fs-extra');
    fsExt.existsSync = orgFsExt.existsSync;
    fsExt.readFileSync = orgFsExt.readFileSync;
    fsExt.lstatSync = orgFsExt.lstatSync;
    fsExt.createReadStream = orgFsExt.createReadStream;

    const mockawsS3 = new aws.S3();

    const orgSkipHooksExist = orgFsExt.existsSync(skipHooksFilePath);

    orgFsExt.ensureFileSync(skipHooksFilePath);
    // skip hooks file exists so no S3 calls relative to hooks should be made
    await pullHooks(mockContext);
    expect(S3_mock_instance.getAllObjectVersions).toHaveBeenCalledTimes(0);
    expect(S3_mock_instance.getFile).toHaveBeenCalledTimes(0);
    expect(fsExt.writeFileSync).toHaveBeenCalledTimes(0);

    await downloadHooks(mockContext, { deploymentArtifacts: bucketName }, { credentials: awsCredentials });
    expect(mockawsS3.listObjects).toHaveBeenCalledTimes(0);
    expect(fsExt.writeFileSync).toHaveBeenCalledTimes(0);

    await uploadHooksDirectory(mockContext);
    expect(S3_mock_instance.deleteDirectory).toHaveBeenCalledTimes(0);
    expect(S3_mock_instance.uploadFile).toHaveBeenCalledTimes(0);

    orgFsExt.removeSync(skipHooksFilePath);
    // skip hooks file does not exists so S3 calls relative to hooks should be made

    await pullHooks(mockContext);
    expect(S3_mock_instance.getAllObjectVersions).not.toHaveBeenCalledTimes(0);

    await downloadHooks(mockContext, { deploymentArtifacts: bucketName }, { credentials: awsCredentials });
    expect(mockawsS3.listObjects).not.toHaveBeenCalledTimes(0);

    await uploadHooksDirectory(mockContext);
    expect(S3_mock_instance.deleteDirectory).not.toHaveBeenCalledTimes(0);

    // resoring the original state of skip hooks file
    if (!orgSkipHooksExist) orgFsExt.removeSync(skipHooksFilePath);
    else orgFsExt.ensureFileSync(skipHooksFilePath);
  });
});
