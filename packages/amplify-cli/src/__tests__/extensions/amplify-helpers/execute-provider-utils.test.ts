import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { executeProviderUtils } from '../../../extensions/amplify-helpers/execute-provider-utils';

jest.mock('../../../extensions/amplify-helpers/get-provider-plugins.ts', () => ({
  getProviderPlugins: jest.fn().mockReturnValue({ awscloudformation: '../../../__mocks__/faked-plugin' }),
}));

jest.mock('../../../../__mocks__/faked-plugin', () => ({
  providerUtils: {
    compileSchema: jest.fn().mockReturnValue(Promise.resolve({})),
    zipFiles: jest.fn(() => {
      return Promise.resolve({});
    }),
  },
}));

describe('executeProviderUtils', () => {
  const mockContext = {} as unknown as $TSContext;
  let options = {};
  it('should execute compileSchema', async () => {
    const util = await executeProviderUtils(mockContext, 'awscloudformation', 'compileSchema', options);
    expect(util).toEqual({});
  });
  it('should execute zipFiles which requires special options', async () => {
    options = ['srcDir', 'dstZipFilePath'];
    const util = await executeProviderUtils(mockContext, 'awscloudformation', 'zipFiles', options);
    expect(util).toEqual({});
  });
  it('should load provider plugin using require() not dynamic import() to support pkg binary', async () => {
    // Ensures the module is loaded synchronously via require(), which is compatible with
    // pkg-bundled binaries where vm.Script does not set importModuleDynamically callback.
    const pluginPath = '../../../../__mocks__/faked-plugin';
    const loaded = require(pluginPath);
    expect(loaded).toBeDefined();
    expect(loaded.providerUtils).toBeDefined();
  });
});
