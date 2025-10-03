/* eslint-disable spellcheck/spell-checker */
import { $TSContext, $TSAny, AmplifyCategories, AmplifySupportedService, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { prompter } from '@aws-amplify/amplify-prompts';
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

const mockPinpointResponseData = (status: boolean, action: ChannelAction): IChannelAPIResponse => ({
  action,
  channel: ChannelType.FCM,
  deploymentType: ChannelConfigDeploymentType.INLINE,
  output: {},
  response: {
    capability: AmplifyCategories.NOTIFICATIONS,
    pluginName: AmplifyCategories.NOTIFICATIONS,
    resourceProviderServiceName: AmplifySupportedService.PINPOINT,
    status,
    subCapability: ChannelType.FCM,
  },
});

const mockContext = (output: $TSAny, client: $TSAny): $TSContext =>
  ({
    exeInfo: {
      serviceMeta: {
        output,
      },
      pinpointClient: client,
    },
    print: {
      info: jest.fn(),
      error: jest.fn(),
    },
  } as unknown as $TSContext);

const mockContextReject = (output: $TSAny, clientReject: $TSAny): $TSAny => ({
  exeInfo: {
    serviceMeta: {
      output,
    },
    pinpointClient: clientReject,
  },
  print: {
    info: jest.fn(),
    error: jest.fn(),
  },
});

describe('channel-FCM', () => {
  const mockServiceOutput: Record<string, unknown> = {};
  const mockChannelEnabledOutput = { Enabled: true };
  mockServiceOutput[channelName] = mockChannelEnabledOutput;

  const mockPinpointResponseErr = new Error('channel-FCM.test.js error');

  const mockPinpointClient = {
    send: jest.fn().mockResolvedValue({ GCMChannelResponse: {} }),
  };

  const mockPinpointClientReject = {
    send: jest.fn().mockRejectedValue(mockPinpointResponseErr),
  };

  test('configure', async () => {
    mockChannelEnabledOutput.Enabled = true;
    prompterMock.yesOrNo.mockResolvedValueOnce(true);
    prompterMock.input.mockResolvedValueOnce(serviceJSONFilePath);

    const mockContextObj = mockContext(mockChannelEnabledOutput, mockPinpointClient);
    await channelFCM.configure(mockContextObj).then(() => {
      expect(mockPinpointClient.send).toBeCalled();
    });

    mockChannelEnabledOutput.Enabled = true;
    prompterMock.yesOrNo.mockResolvedValueOnce(false);
    await channelFCM.configure(mockContext(mockChannelEnabledOutput, mockPinpointClient)).then(() => {
      expect(mockPinpointClient.send).toBeCalled();
    });

    mockChannelEnabledOutput.Enabled = false;
    prompterMock.yesOrNo.mockResolvedValueOnce(true);
    await channelFCM.configure(mockContext(mockChannelEnabledOutput, mockPinpointClient)).then(() => {
      expect(mockPinpointClient.send).toBeCalled();
    });
  });

  test('enable', async () => {
    prompterMock.input.mockResolvedValueOnce(serviceJSONFilePath);
    const mockContextObj = mockContext(mockChannelEnabledOutput, mockPinpointClient);
    const data = await channelFCM.enable(mockContextObj, 'successMessage');
    expect(mockPinpointClient.send).toBeCalled();
    expect(data).toEqual(mockPinpointResponseData(true, ChannelAction.ENABLE));
  });

  test('enable unsuccessful', async () => {
    prompterMock.input.mockResolvedValueOnce(serviceJSONFilePath);

    const context = mockContextReject(mockServiceOutput, mockPinpointClientReject);
    const errCert: AmplifyFault = await getError(async () => channelFCM.enable(context as unknown as $TSContext, 'successMessage'));
    expect(context.exeInfo.pinpointClient.send).toBeCalled();
    expect(errCert?.downstreamException?.message).toContain(mockPinpointResponseErr.message);
  });

  test('disable', async () => {
    const data = await channelFCM.disable(mockContextReject(mockServiceOutput, mockPinpointClient));
    expect(mockPinpointClient.send).toBeCalled();
    expect(data).toEqual(mockPinpointResponseData(true, ChannelAction.DISABLE));
  });

  test('disable unsuccessful', async () => {
    const errDisable: AmplifyFault = await getError(async () =>
      channelFCM.disable(mockContextReject(mockServiceOutput, mockPinpointClientReject)),
    );
    expect(mockPinpointClientReject.send).toBeCalled();
    expect(errDisable?.downstreamException?.message).toContain(mockPinpointResponseErr.message);
  });
});
