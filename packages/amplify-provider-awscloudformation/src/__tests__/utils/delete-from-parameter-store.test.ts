import { $TSContext } from 'amplify-cli-core';
import { getEnvParametersDeleteHandler } from '../../utils/delete-from-parameter-store';
import { SSM } from '../../aws-utils/aws-ssm';

jest.mock('../../aws-utils/aws-ssm');
const mockSSM = SSM as jest.Mocked<typeof SSM>;
const deleteParametersPromiseMock = jest.fn().mockImplementation(() => Promise.resolve());
mockSSM.getInstance = jest.fn().mockResolvedValue({
  client: {
    deleteParameters: jest.fn().mockImplementation(() => ({
      promise: deleteParametersPromiseMock,
    })),
  },
});

describe('parameters-delete-handler', () => {
  it('check if returned function is defined', async () => {
    const envName: string = 'dev';
    const keys: Array<string> = ['one', 'two'];
    const contextStub = {
      exeInfo: {
        inputParams: {
          amplify: {
            appId: '1',
          },
        },
      },
    };

    const deleteParametersFromParameterStoreFn = await getEnvParametersDeleteHandler((contextStub as unknown) as $TSContext, envName);
    expect(deleteParametersFromParameterStoreFn).toBeDefined();
    await deleteParametersFromParameterStoreFn(keys);
    expect(deleteParametersPromiseMock).toBeCalledTimes(1);
  });
});
