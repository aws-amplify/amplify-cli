import { $TSContext } from 'amplify-cli-core';
import { deleteEnvironmentParametersFromService } from '../../utils/delete-from-service';
import { SSM } from '../../aws-utils/aws-ssm';
import type { SSM as SSMType } from 'aws-sdk';
import { getSsmSdkParametersDeleteParameters, getSsmSdkParametersGetParametersByPath } from '../../utils/get-ssm-sdk-parameters';

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
    const deleteParametersMock = jest.fn().mockImplementation(() => ({ promise: deleteParametersPromiseMock }));

    const mockGetParamatersReturnedObject: SSMType.GetParametersByPathResult = {
      Parameters: keys.map(key => {
        return { Name: key };
      }),
    };
    const getParametersByPathPromiseMock = jest.fn().mockImplementation(() => Promise.resolve(mockGetParamatersReturnedObject));
    const getParametersByPathMock = jest.fn().mockImplementation(() => ({ promise: getParametersByPathPromiseMock }));

    const mockSSM = SSM as jest.Mocked<typeof SSM>;
    mockSSM.getInstance = jest.fn().mockResolvedValue({
      client: {
        deleteParameters: deleteParametersMock,
        getParametersByPath: getParametersByPathMock,
      },
    });

    await deleteEnvironmentParametersFromService((contextStub as unknown) as $TSContext, envName);
    expect(deleteParametersPromiseMock).toBeCalledTimes(1);
    expect(deleteParametersMock).toBeCalledTimes(1);
    const expectedDeleteParamater = getSsmSdkParametersDeleteParameters(keys);
    expect(deleteParametersMock).toBeCalledWith(expectedDeleteParamater);

    expect(getParametersByPathPromiseMock).toBeCalledTimes(1);
    expect(getParametersByPathMock).toBeCalledTimes(1);
    const expectedGetParamater = getSsmSdkParametersGetParametersByPath(fakeAppId, envName);
    expect(getParametersByPathMock).toBeCalledWith(expectedGetParamater);
  });
});
