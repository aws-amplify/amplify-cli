import { $TSContext, convertNumBytes, getFolderSize, pathManager } from 'amplify-cli-core';
import { FunctionRuntimeLifecycleManager } from 'amplify-function-plugin-interface';
import { packageLayer } from '../../../../provider-utils/awscloudformation/utils/packageLayer';
import { PackageRequestMeta } from '../../../../provider-utils/awscloudformation/types/packaging-types';
import { LayerCloudState } from '../../../../provider-utils/awscloudformation/utils/layerCloudState';
import { loadLayerConfigurationFile } from '../../../../provider-utils/awscloudformation/utils/layerConfiguration';

jest.mock('fs-extra');
jest.mock('amplify-cli-core');
jest.mock('../../../../provider-utils/awscloudformation/utils/functionPluginLoader');
jest.mock('../../../../provider-utils/awscloudformation/utils/layerConfiguration');
jest.mock('../../../../provider-utils/awscloudformation/utils/layerCloudState');
jest.mock('../../../../provider-utils/awscloudformation/utils/layerHelpers', () => ({
  loadPreviousLayerHash: jest.fn(),
  loadStoredLayerParameters: jest.fn(),
  getChangedResources: jest.fn(),
  ensureLayerVersion: jest.fn().mockReturnValue('newhash'),
}));
jest.mock('../../../../provider-utils/awscloudformation/utils/zipResource');

const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
const getFolderSize_mock = getFolderSize as jest.MockedFunction<typeof getFolderSize>;
const convertNumBytes_mock = convertNumBytes as jest.MockedFunction<typeof convertNumBytes>;

const loadLayerConfigurationFile_mock = loadLayerConfigurationFile as jest.MockedFunction<typeof loadLayerConfigurationFile>;
loadLayerConfigurationFile_mock.mockReturnValue({
  permissions: [
    {
      type: 'Private',
    },
  ],
  runtimes: [
    {
      value: 'nodejs',
      name: 'NodeJS',
      runtimePluginId: 'amplify-nodejs-function-runtime-provider',
      layerExecutablePath: 'nodejs',
    },
  ],
});

pathManager_mock.getResourceDirectoryPath.mockReturnValue('backend/dir/path/testcategory/testResourceName/');

const runtimePlugin_stub = ({
  checkDependencies: jest.fn().mockResolvedValue({ hasRequiredDependencies: true }),
  package: jest.fn().mockResolvedValue({ packageHash: true }),
} as unknown) as jest.Mocked<FunctionRuntimeLifecycleManager>;

const context_stub = ({
  amplify: {
    loadRuntimePlugin: jest.fn().mockResolvedValue(runtimePlugin_stub),
    getEnvInfo: jest.fn().mockReturnValue({ envName: 'mockEnv' }),
    updateAmplifyMetaAfterPackage: jest.fn(),
  },
} as unknown) as jest.Mocked<$TSContext>;

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

const layerCloudState_mock = LayerCloudState as jest.Mocked<typeof LayerCloudState>;
layerCloudState_mock.getInstance.mockReturnValue(({
  latestVersionLogicalId: 'mockLogicalId',
} as unknown) as LayerCloudState);

describe('package function', () => {
  it('delegates packaging to the runtime manager', async () => {
    getFolderSize_mock.mockResolvedValue(100 * 1024 ** 2); // 100MB
    await packageLayer((context_stub as unknown) as $TSContext, resourceRequest);
    expect(runtimePlugin_stub.package.mock.calls[0][0].srcRoot).toEqual('backend/dir/path/testcategory/testResourceName/lib/nodejs');
  });

  it('updates amplify meta after packaging', async () => {
    getFolderSize_mock.mockResolvedValue(100 * 1024 ** 2); // 100MB
    await packageLayer((context_stub as unknown) as $TSContext, resourceRequest);
    expect((context_stub.amplify.updateAmplifyMetaAfterPackage as jest.Mock).mock.calls[0][0]).toEqual(resourceRequest);
  });

  it('fails to pacakge layer that is greater than 250MB in size', async () => {
    getFolderSize_mock.mockResolvedValue(260 * 1024 ** 2); // 260MB
    convertNumBytes_mock.mockReturnValue({ toKB: jest.fn(), toMB: jest.fn().mockReturnValueOnce(260) });
    await expect(async () => await packageLayer((context_stub as unknown) as $TSContext, resourceRequest)).rejects.toEqual(
      new Error(`Lambda layer ${resourceRequest.resourceName} is too large: 260/250 MB`),
    );
  });
});
