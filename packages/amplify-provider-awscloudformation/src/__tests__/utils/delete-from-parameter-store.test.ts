import { $TSContext, AmplifyFault } from 'amplify-cli-core';
import { getEnvParametersDeleteHandler } from '../../utils/delete-from-service';
import { SSM } from '../../aws-utils/aws-ssm';
import { getSsmSdkParametersDeleteMultiKeys } from '../../utils/get-ssm-sdk-parameters';

jest.mock('../../aws-utils/aws-ssm');

const fakeAppId = 'fakeAppId';
const keys: Array<string> = ['one', 'two'];
const envName: string = 'dev';
const contextStub = {
  exeInfo: {
    inputParams: {
      amplify: {
        appId: fakeAppId,
      },
    },
  },
};

describe('parameters-delete-handler', () => {
  it('check if returned function is called once with correct paramater', async () => {
    const deleteParametersPromiseMock = jest.fn().mockImplementation(() => Promise.resolve());
    const deleteParameters = jest.fn().mockImplementation(() => ({ promise: deleteParametersPromiseMock }));
    const mockSSM = SSM as jest.Mocked<typeof SSM>;
    mockSSM.getInstance = jest.fn().mockResolvedValue({
      client: {
        deleteParameters: deleteParameters,
      },
    });

    const deleteParametersFromService = await getEnvParametersDeleteHandler((contextStub as unknown) as $TSContext, envName);
    await deleteParametersFromService(keys);
    expect(deleteParametersPromiseMock).toBeCalledTimes(1);
    expect(deleteParameters).toBeCalledTimes(1);
    const expectedParamater = getSsmSdkParametersDeleteMultiKeys(fakeAppId, envName, keys);
    expect(deleteParameters).toBeCalledWith(expectedParamater);
  });
});
