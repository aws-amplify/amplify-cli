/* eslint-disable spellcheck/spell-checker */
import { $TSContext, $TSAny, AmplifyCategories, AmplifySupportedService, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { prompter } from '@aws-amplify/amplify-prompts';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { PinpointClient, UpdateGcmChannelCommand } from '@aws-sdk/client-pinpoint';
import * as channelFCM from '../channel-fcm';
import { ChannelAction, ChannelConfigDeploymentType, IChannelAPIResponse } from '../channel-types';
import { ChannelType } from '../notifications-backend-cfg-channel-api';

jest.mock('@aws-amplify/amplify-cli-core', () => {
  return {
    ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
    FeatureFlags: {
      getBoolean: jest.fn(),
      getNumber: jest.fn(),
      getObject: jest.fn(),
      getString: jest.fn(),
    },
  };
});

const serviceJSONFilePath = '/my/service/account/jsonFile.json';
const serviceAccountJson = '{ "valid": { "service": "accountJson"}}';
jest.mock('fs-extra', () => ({
  readFile: () => Promise.resolve(serviceAccountJson),
  existsSync: () => true,
}));
jest.mock('@aws-amplify/amplify-prompts');
const prompterMock = prompter as jest.Mocked<typeof prompter>;

const mockPinpointClient = mockClient(PinpointClient);

class NoErrorThrownError extends Error {}
const getError = async <TError>(call: () => unknown): Promise<TError> => {
  try {
    await call();
    throw new NoErrorThrownError();
  } catch (error: unknown) {
    return error as TError;
  }
};
const channelName = 'FCM';

const mockPinpointResponseData = (status: boolean, action: ChannelAction, output: any): IChannelAPIResponse => ({
  action,
  channel: ChannelType.FCM,
  deploymentType: ChannelConfigDeploymentType.INLINE,
  output,
  response: {
    capability: AmplifyCategories.NOTIFICATIONS,
    pluginName: AmplifyCategories.NOTIFICATIONS,
    resourceProviderServiceName: AmplifySupportedService.PINPOINT,
    status,
    subCapability: ChannelType.FCM,
  },
});

const mockContext = (output: $TSAny): $TSContext =>
  ({
    exeInfo: {
      serviceMeta: {
        output,
      },
      pinpointClient: mockPinpointClient as unknown as PinpointClient,
    },
    print: {
      info: jest.fn(),
      error: jest.fn(),
    },
  } as unknown as $TSContext);

describe('channel-FCM', () => {
  const mockServiceOutput: Record<string, unknown> = {};
  const mockChannelEnabledOutput = { Enabled: true };
  mockServiceOutput[channelName] = mockChannelEnabledOutput;

  const mockPinpointResponseErr = new Error('channel-FCM.test.js error');
  const mockGCMChannelResponse = {
    Enabled: true,
    ApplicationId: 'test-app-id',
    Platform: 'GCM' as const,
  };

  beforeEach(() => {
    mockPinpointClient.reset();
  });

  test('configure', async () => {
    mockPinpointClient.on(UpdateGcmChannelCommand).resolves({ GCMChannelResponse: mockGCMChannelResponse });

    mockChannelEnabledOutput.Enabled = true;
    prompterMock.yesOrNo.mockResolvedValueOnce(true);
    prompterMock.input.mockResolvedValueOnce(serviceJSONFilePath);

    const mockContextObj = mockContext(mockChannelEnabledOutput);
    await channelFCM.configure(mockContextObj);
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateGcmChannelCommand);

    mockChannelEnabledOutput.Enabled = true;
    prompterMock.yesOrNo.mockResolvedValueOnce(false);
    prompterMock.input.mockResolvedValueOnce(serviceJSONFilePath);
    await channelFCM.configure(mockContext(mockChannelEnabledOutput));
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateGcmChannelCommand);

    mockChannelEnabledOutput.Enabled = false;
    prompterMock.yesOrNo.mockResolvedValueOnce(true);
    prompterMock.input.mockResolvedValueOnce(serviceJSONFilePath);
    await channelFCM.configure(mockContext(mockChannelEnabledOutput));
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateGcmChannelCommand);
  });

  test('enable', async () => {
    mockPinpointClient.on(UpdateGcmChannelCommand).resolves({ GCMChannelResponse: mockGCMChannelResponse });
    prompterMock.input.mockResolvedValueOnce(serviceJSONFilePath);
    const mockContextObj = mockContext(mockChannelEnabledOutput);
    const data = await channelFCM.enable(mockContextObj, 'successMessage');
    expect(mockPinpointClient).toHaveReceivedCommandWith(UpdateGcmChannelCommand, {
      ApplicationId: undefined,
      GCMChannelRequest: {
        ServiceJson: serviceAccountJson,
        DefaultAuthenticationMethod: 'TOKEN',
        Enabled: true,
      },
    });
    expect(data).toEqual(mockPinpointResponseData(true, ChannelAction.ENABLE, mockGCMChannelResponse));
  });

  test('enable unsuccessful', async () => {
    mockPinpointClient.on(UpdateGcmChannelCommand).rejects(mockPinpointResponseErr);
    prompterMock.input.mockResolvedValueOnce(serviceJSONFilePath);

    const context = mockContext(mockServiceOutput);
    const errCert: AmplifyFault = await getError(async () => channelFCM.enable(context, 'successMessage'));
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateGcmChannelCommand);
    expect(errCert?.downstreamException?.message).toContain(mockPinpointResponseErr.message);
  });

  test('disable', async () => {
    mockPinpointClient.on(UpdateGcmChannelCommand).resolves({ GCMChannelResponse: mockGCMChannelResponse });
    prompterMock.input.mockResolvedValueOnce(serviceJSONFilePath);
    const data = await channelFCM.disable(mockContext(mockServiceOutput));
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateGcmChannelCommand);
    expect(data).toEqual(mockPinpointResponseData(true, ChannelAction.DISABLE, mockGCMChannelResponse));
  });

  test('disable unsuccessful', async () => {
    mockPinpointClient.on(UpdateGcmChannelCommand).rejects(mockPinpointResponseErr);
    prompterMock.input.mockResolvedValueOnce(serviceJSONFilePath);
    await expect(channelFCM.disable(mockContext(mockServiceOutput))).rejects.toThrowError('Failed to disable the FCM channel');
  });
});
