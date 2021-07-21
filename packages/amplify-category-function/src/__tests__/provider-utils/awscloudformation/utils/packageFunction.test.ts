import { getRuntimeManager } from '../../../../provider-utils/awscloudformation/utils/functionPluginLoader';
import { $TSContext, getFolderSize, pathManager } from 'amplify-cli-core';
import { packageFunction } from '../../../../provider-utils/awscloudformation/utils/packageFunction';
import { PackageRequestMeta } from '../../../../provider-utils/awscloudformation/types/packaging-types';
import { zipPackage } from '../../../../provider-utils/awscloudformation/utils/zipResource';

jest.mock('fs-extra');
jest.mock('amplify-cli-core');
jest.mock('../../../../provider-utils/awscloudformation/utils/functionPluginLoader');
jest.mock('../../../../provider-utils/awscloudformation/utils/zipResource');

const context_stub = {
  amplify: {
    getEnvInfo: jest.fn().mockReturnValue({ envName: 'mockEnv' }),
    updateAmplifyMetaAfterPackage: jest.fn(),
  },
};

const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
const getRuntimeManager_mock = getRuntimeManager as jest.MockedFunction<typeof getRuntimeManager>;
const zipPackage_mock = zipPackage as jest.MockedFunction<typeof zipPackage>;
const getFolderSize_mock = getFolderSize as jest.MockedFunction<typeof getFolderSize>;

pathManager_mock.getResourceDirectoryPath.mockReturnValue('backend/dir/path/testcategory/testResourceName');
getFolderSize_mock.mockResolvedValue(50 * 1024 ** 2);

const runtimeManager_mock = {
  package: jest.fn().mockResolvedValue({
    packageHash: 'testpackagehash',
    zipEntries: ['mock/zip/entry'],
  }),
};
getRuntimeManager_mock.mockResolvedValue(runtimeManager_mock as any);
zipPackage_mock.mockResolvedValue('mockedZipName.zip');

const resourceRequest: PackageRequestMeta = {
  category: 'testcategory',
  resourceName: 'testResourceName',
  service: 'testservice',
  build: true,
  lastPackageTimeStamp: 'lastpackagetime',
  lastBuildTimeStamp: 'lastbuildtime',
  distZipFilename: 'testzipfile',
  skipHashing: false,
};

describe('package function', () => {
  it('delegates packaging to the runtime manager', async () => {
    await packageFunction((context_stub as unknown) as $TSContext, resourceRequest);
    expect(runtimeManager_mock.package.mock.calls[0][0].srcRoot).toEqual('backend/dir/path/testcategory/testResourceName');
  });

  it('updates amplify meta after packaging', async () => {
    await packageFunction((context_stub as unknown) as $TSContext, resourceRequest);
    expect(context_stub.amplify.updateAmplifyMetaAfterPackage.mock.calls[0][0]).toEqual(resourceRequest);
  });

  it('throws an error when the size of the function is too large', async () => {
    getFolderSize_mock.mockResolvedValueOnce(251 * 1024 ** 2);
    await expect(async () => await packageFunction((context_stub as unknown) as $TSContext, resourceRequest)).rejects.toThrow();
  });
});
