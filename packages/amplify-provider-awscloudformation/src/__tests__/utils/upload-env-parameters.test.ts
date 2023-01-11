import { $TSContext, stateManager } from 'amplify-cli-core';
import { SSM } from '../../aws-utils/aws-ssm';
import { getEnvParametersUploadHandler } from '../../utils/upload-env-parameters';

jest.mock('amplify-cli-core');
jest.mock('../../aws-utils/aws-ssm');

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const mockSSM = SSM as jest.Mocked<typeof SSM>;

stateManagerMock.metaFileExists = jest.fn().mockReturnValue(true);
stateManagerMock.getMeta = jest.fn();
stateManagerMock.getCurrentEnvName = jest.fn().mockReturnValue('mocked');

const putParameterPromiseMock = jest.fn().mockImplementation(() => Promise.resolve());

mockSSM.getInstance = jest.fn().mockResolvedValue({
  client: {
    putParameter: jest.fn().mockImplementation(() => ({
      promise: putParameterPromiseMock,
    })),
  },
});

const contextMock = {} as unknown as $TSContext;


describe('uploading environment parameters', () => {
  it('returns an async function which can invoke the SSM client', async () => {
    stateManagerMock.getMeta.mockReturnValueOnce({ 'providers': { 'awscloudformation': { 'AmplifyAppId': 'mockedAppId' } } });
    const returnedFn = await getEnvParametersUploadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    await returnedFn!('key', 'value');
    expect(putParameterPromiseMock).toBeCalledTimes(1);
  });

  it('returns undefined when AmplifyAppId is undefined', async () => {
    stateManagerMock.getMeta.mockReturnValueOnce({ 'providers': { 'awscloudformation': {} } });
    const returnedFn = await getEnvParametersUploadHandler(contextMock);
    expect(returnedFn).not.toBeDefined();
  });
});
