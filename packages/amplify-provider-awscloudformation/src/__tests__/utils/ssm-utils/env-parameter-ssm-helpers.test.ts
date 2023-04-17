import { $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import { SSM } from '../../../aws-utils/aws-ssm';
import type { SSM as SSMType } from 'aws-sdk';
import { getEnvParametersDownloadHandler, getEnvParametersUploadHandler } from '../../../utils/ssm-utils/env-parameter-ssm-helpers';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('../../../aws-utils/aws-ssm');

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const mockSSM = SSM as jest.Mocked<typeof SSM>;

stateManagerMock.metaFileExists = jest.fn().mockReturnValue(true);
stateManagerMock.getMeta = jest.fn();
stateManagerMock.getCurrentEnvName = jest.fn().mockReturnValue('mockEnv');

const putParameterPromiseMock = jest.fn().mockImplementation(() => Promise.resolve());
const getParametersPromiseMock = jest.fn().mockImplementation(() => Promise.resolve());

const getParametersMock = jest.fn().mockImplementation(() => ({
  promise: getParametersPromiseMock,
}));

mockSSM.getInstance = jest.fn().mockResolvedValue({
  client: {
    putParameter: jest.fn().mockImplementation(() => ({
      promise: putParameterPromiseMock,
    })),
    getParameters: getParametersMock,
  },
});

const contextMock = {} as unknown as $TSContext;

jest.useFakeTimers();

describe('uploading environment parameters', () => {
  it('returns an async function which can invoke the SSM client', async () => {
    stateManagerMock.getMeta.mockReturnValueOnce({ providers: { awscloudformation: { AmplifyAppId: 'mockedAppId' } } });
    const returnedFn = await getEnvParametersUploadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    await returnedFn('key', 'value');
    expect(putParameterPromiseMock).toBeCalledTimes(1);
  });

  it('returns no-op when AmplifyAppId is undefined', async () => {
    stateManagerMock.getMeta.mockReturnValueOnce({ providers: { awscloudformation: {} } });
    const returnedFn = await getEnvParametersUploadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    await returnedFn('key1', 'value');
    await returnedFn('key2', 'value');
    expect(getParametersPromiseMock).not.toBeCalled();
  });
});

describe('downloading environment parameters', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('returns no-op when AmplifyAppId is undefined', async () => {
    stateManagerMock.getMeta.mockReturnValueOnce({ providers: { awscloudformation: {} } });
    const returnedFn = await getEnvParametersDownloadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    const mockParams = await returnedFn(['mockMissingParam']);
    expect(mockParams).toStrictEqual({});
    expect(getParametersMock).not.toBeCalled();
  });

  it('returns {} when no keys are supplied', async () => {
    stateManagerMock.getMeta.mockReturnValueOnce({ providers: { awscloudformation: { AmplifyAppId: 'mockedAppId' } } });
    const returnedFn = await getEnvParametersDownloadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    const mockParams = await returnedFn([]);
    expect(mockParams).toStrictEqual({});
    expect(getParametersMock).not.toBeCalled();
  });

  it('returns an async function which can invoke the SSM client', async () => {
    stateManagerMock.getMeta.mockReturnValueOnce({ providers: { awscloudformation: { AmplifyAppId: 'mockedAppId' } } });
    const singleResultMock: SSMType.GetParametersResult = { Parameters: [{ Name: '/amplify/mockAppId/mockEnv/key', Value: '"value"' }] };
    getParametersPromiseMock.mockResolvedValueOnce(singleResultMock);

    const returnedFn = await getEnvParametersDownloadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    const mockParams = await returnedFn(['key']);
    expect(mockParams).toStrictEqual({ key: 'value' });
    expect(getParametersMock).toBeCalledTimes(1);
    expect(getParametersPromiseMock).toBeCalledTimes(1);
  });

  it('returns function which can handle many parameters in a single request', async () => {
    stateManagerMock.getMeta.mockReturnValueOnce({ providers: { awscloudformation: { AmplifyAppId: 'mockedAppId' } } });
    const keys: string[] = [];
    const mockCloudParams: { Name: string; Value: string }[] = [];
    const expectedParams = {};
    for (let i = 0; i < 12; ++i) {
      const key = `key${i}`;
      keys.push(key);
      expectedParams[key] = 'value';
      mockCloudParams.push({ Name: `/amplify/mockedAppId/mockEnv/${key}`, Value: '"value"' });
    }
    const expectedKeyPaths = keys.map((key) => `/amplify/mockedAppId/mockEnv/${key}`);
    getParametersPromiseMock.mockResolvedValueOnce({ Parameters: mockCloudParams.slice(0, 10) });
    getParametersPromiseMock.mockResolvedValueOnce({ Parameters: mockCloudParams.slice(10) });

    const returnedFn = await getEnvParametersDownloadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    const mockParams = await returnedFn(keys);
    expect(getParametersMock).toBeCalledTimes(2);
    expect(getParametersMock).toBeCalledWith({
      Names: expectedKeyPaths.slice(0, 10),
      WithDecryption: false,
    });
    expect(getParametersMock).toBeCalledWith({
      Names: expectedKeyPaths.slice(10),
      WithDecryption: false,
    });
    expect(mockParams).toStrictEqual(expectedParams);
    expect(getParametersPromiseMock).toBeCalledTimes(2);
  });
});
