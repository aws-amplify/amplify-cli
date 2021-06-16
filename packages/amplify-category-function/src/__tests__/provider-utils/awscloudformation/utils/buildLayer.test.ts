import { $TSContext, pathManager } from 'amplify-cli-core';
import { FunctionRuntimeLifecycleManager } from 'amplify-function-plugin-interface';
import { buildLayer } from '../../../../provider-utils/awscloudformation/utils/buildLayer';
import { loadLayerConfigurationFile } from '../../../../provider-utils/awscloudformation/utils/layerConfiguration';

jest.mock('amplify-cli-core');
jest.mock('../../../../provider-utils/awscloudformation/utils/layerConfiguration');

const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
pathManager_mock.getBackendDirPath.mockReturnValue('mockpath');

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

const runtimePlugin_stub = ({
  checkDependencies: jest.fn().mockResolvedValue({ hasRequiredDependencies: true }),
  build: jest.fn().mockResolvedValue({ rebuilt: true }),
} as unknown) as jest.Mocked<FunctionRuntimeLifecycleManager>;

const context_stub = ({
  amplify: {
    readBreadcrumbs: jest.fn().mockReturnValue({ pluginId: 'testPluginId' }),
    loadRuntimePlugin: jest.fn().mockResolvedValue(runtimePlugin_stub),
    updateamplifyMetaAfterBuild: jest.fn(),
  },
} as unknown) as jest.Mocked<$TSContext>;

describe('build function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates dependency checks to the runtime manager before building', async () => {
    let depCheck = false;
    runtimePlugin_stub.checkDependencies.mockImplementationOnce(async () => {
      depCheck = true;
      return {
        hasRequiredDependencies: true,
      };
    });

    runtimePlugin_stub.build.mockImplementationOnce(async () => {
      if (!depCheck) {
        throw new Error('Dep check not called before build');
      }
      return {
        rebuilt: true,
      };
    });

    await buildLayer(context_stub, { resourceName: 'testFunc' });

    expect(runtimePlugin_stub.checkDependencies.mock.calls.length).toBe(1);
    expect(runtimePlugin_stub.build.mock.calls.length).toBe(1);
  });

  it('updates amplify meta after prod', async () => {
    await buildLayer(context_stub, { resourceName: 'testFunc' });

    expect((context_stub.amplify.updateamplifyMetaAfterBuild as jest.Mock).mock.calls[0]).toEqual([
      { category: 'function', resourceName: 'testFunc' },
      'PROD',
    ]);
  });

  it('doesnt update amplify meta if function not rebuilt', async () => {
    runtimePlugin_stub.build.mockResolvedValueOnce({ rebuilt: false });

    await buildLayer(context_stub, { resourceName: 'testFunc' });

    expect((context_stub.amplify.updateamplifyMetaAfterBuild as jest.Mock).mock.calls.length).toBe(0);
  });
});
