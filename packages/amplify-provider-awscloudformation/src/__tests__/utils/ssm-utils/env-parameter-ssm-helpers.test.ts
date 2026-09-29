import { $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import { SSM } from '../../../aws-utils/aws-ssm';
import { GetParametersCommand, GetParametersCommandOutput, PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { getEnvParametersDownloadHandler, getEnvParametersUploadHandler } from '../../../utils/ssm-utils/env-parameter-ssm-helpers';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('../../../aws-utils/aws-ssm');

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const mockSSM = SSM as jest.Mocked<typeof SSM>;

stateManagerMock.metaFileExists = jest.fn().mockReturnValue(true);
stateManagerMock.getMeta = jest.fn();
stateManagerMock.getCurrentEnvName = jest.fn().mockReturnValue('mockEnv');

const mockSsmClient = mockClient(SSMClient);

mockSSM.getInstance = jest.fn().mockResolvedValue({
  client: mockSsmClient as unknown as SSMClient,
});

const contextMock = {} as unknown as $TSContext;

jest.useFakeTimers();

describe('uploading environment parameters', () => {
  beforeEach(() => {
    mockSsmClient.reset();
  });

  it('returns an async function which can invoke the SSM client', async () => {
    stateManagerMock.getMeta.mockReturnValueOnce({ providers: { awscloudformation: { AmplifyAppId: 'mockedAppId' } } });
    mockSsmClient.on(PutParameterCommand).resolves({});

    const returnedFn = await getEnvParametersUploadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    await returnedFn('key', 'value');

    expect(mockSsmClient.calls().length).toBe(1);
    expect(mockSsmClient).toHaveReceivedCommandTimes(PutParameterCommand, 1);
  });

  it('returns no-op when AmplifyAppId is undefined', async () => {
    stateManagerMock.getMeta.mockReturnValueOnce({ providers: { awscloudformation: {} } });
    const returnedFn = await getEnvParametersUploadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    await returnedFn('key1', 'value');
    await returnedFn('key2', 'value');
    expect(mockSsmClient.calls().length).toBe(0);
    expect(mockSsmClient).toHaveReceivedCommandTimes(PutParameterCommand, 0);
  });
});

describe('downloading environment parameters', () => {
  beforeEach(() => {
    mockSsmClient.reset();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('returns no-op when AmplifyAppId is undefined', async () => {
    stateManagerMock.getMeta.mockReturnValueOnce({ providers: { awscloudformation: {} } });
    const returnedFn = await getEnvParametersDownloadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    const mockParams = await returnedFn(['mockMissingParam']);
    expect(mockParams).toStrictEqual({});
    expect(mockSsmClient.calls().length).toBe(0);
    expect(mockSsmClient).toHaveReceivedCommandTimes(GetParametersCommand, 0);
  });

  it('returns {} when no keys are supplied', async () => {
    stateManagerMock.getMeta.mockReturnValueOnce({ providers: { awscloudformation: { AmplifyAppId: 'mockedAppId' } } });
    const returnedFn = await getEnvParametersDownloadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    const mockParams = await returnedFn([]);
    expect(mockParams).toStrictEqual({});
    expect(mockSsmClient.calls().length).toBe(0);
    expect(mockSsmClient).toHaveReceivedCommandTimes(GetParametersCommand, 0);
  });

  it('returns an async function which can invoke the SSM client', async () => {
    stateManagerMock.getMeta.mockReturnValueOnce({ providers: { awscloudformation: { AmplifyAppId: 'mockedAppId' } } });

    const singleResultMock: GetParametersCommandOutput = {
      Parameters: [{ Name: '/amplify/mockAppId/mockEnv/key', Value: '"value"' }],
      $metadata: {},
    };
    mockSsmClient.on(GetParametersCommand).resolves(singleResultMock);

    const returnedFn = await getEnvParametersDownloadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    const mockParams = await returnedFn(['key']);
    expect(mockParams).toStrictEqual({ key: 'value' });
    expect(mockSsmClient.calls().length).toBe(1);
    expect(mockSsmClient).toHaveReceivedCommandTimes(GetParametersCommand, 1);
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

    mockSsmClient
      .on(GetParametersCommand)
      .resolvesOnce({
        Parameters: mockCloudParams.slice(0, 10),
        $metadata: {},
      })
      .resolvesOnce({
        Parameters: mockCloudParams.slice(10),
        $metadata: {},
      });

    const returnedFn = await getEnvParametersDownloadHandler(contextMock);
    expect(returnedFn).toBeDefined();
    const mockParams = await returnedFn(keys);

    expect(mockSsmClient.calls().length).toBe(2);
    expect(mockSsmClient).toHaveReceivedCommandTimes(GetParametersCommand, 2);

    // Check first call
    expect(mockSsmClient.call(0).args[0].input).toEqual({
      Names: expectedKeyPaths.slice(0, 10),
      WithDecryption: false,
    });

    // Check second call
    expect(mockSsmClient.call(1).args[0].input).toEqual({
      Names: expectedKeyPaths.slice(10),
      WithDecryption: false,
    });

    expect(mockParams).toStrictEqual(expectedParams);
  });
});
