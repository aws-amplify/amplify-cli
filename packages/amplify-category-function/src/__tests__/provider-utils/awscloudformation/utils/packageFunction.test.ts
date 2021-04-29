import { getRuntimeManager } from '../../../../provider-utils/awscloudformation/utils/functionPluginLoader';
import { $TSContext, pathManager } from 'amplify-cli-core';
import { packageFunction } from '../../../../provider-utils/awscloudformation/utils/packageFunction';
import { PackageRequestMeta } from '../../../../provider-utils/awscloudformation/types/packaging-types';

jest.mock('fs-extra');
jest.mock('amplify-cli-core');
jest.mock('../../../../provider-utils/awscloudformation/utils/functionPluginLoader');

const context_stub = {
  amplify: {
    getEnvInfo: jest.fn().mockReturnValue({ envName: 'mockEnv' }),
    updateAmplifyMetaAfterPackage: jest.fn(),
  },
};

const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
const getRuntimeManager_mock = getRuntimeManager as jest.MockedFunction<typeof getRuntimeManager>;

pathManager_mock.getBackendDirPath.mockReturnValue('backend/dir/path');

const runtimeManager_mock = {
  package: jest.fn().mockResolvedValue({
    packageHash: 'testpackagehash',
  }),
};
getRuntimeManager_mock.mockResolvedValue(runtimeManager_mock as any);

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
});
