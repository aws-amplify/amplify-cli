import { $TSContext, stateManager } from 'amplify-cli-core';
import { SSM } from '../../aws-utils/aws-ssm';
import { getEnvParametersUploadHandler } from '../../utils/upload-env-parameters';

jest.mock('amplify-cli-core');

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const mockSSM = SSM as jest.Mocked<typeof SSM>;

stateManagerMock.metaFileExists = jest.fn().mockReturnValueOnce(true);
stateManagerMock.getMeta = jest.fn().mockReturnValueOnce({ 'providers': { 'awscloudformation': { 'AmplifyAppId': 'mockedAppId' } } });
stateManagerMock.getCurrentEnvName = jest.fn().mockResolvedValueOnce('mocked');

const putParameterPromiseMock = jest.fn();

mockSSM.getInstance = jest.fn().mockResolvedValue({
  putParameter: {
    promise: putParameterPromiseMock,
  },
});

const contextMock = {} as unknown as $TSContext;


describe('uploading environment parameters', () => {
  it('returns an function and ', async () => {
    const returnedFn = await getEnvParametersUploadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    await returnedFn('key', 'value');
    expect(putParameterPromiseMock).toBeCalledTimes(1);
  });
});
