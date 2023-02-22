import { $TSContext } from '../..';
import { executeProviderUtils } from '../../extensions/execute-provider-utils';
import * as getProviderPlugins from '../../extensions/get-provider-plugins';

jest.spyOn(getProviderPlugins, 'getProviderPlugins').mockReturnValue({ awscloudformation: '../../__mocks__/faked-plugin' });
jest.mock('../../../__mocks__/faked-plugin', () => ({
  providerUtils: {
    compileSchema: jest.fn().mockReturnValue(Promise.resolve({})),
    zipFiles: jest.fn((context, [srcDir, dstZipFilePath]) => {
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
});
