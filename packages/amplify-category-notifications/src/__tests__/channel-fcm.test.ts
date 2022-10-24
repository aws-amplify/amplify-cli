/* eslint-disable spellcheck/spell-checker */
import {
  $TSContext, $TSAny, AmplifyCategories, AmplifySupportedService,
} from 'amplify-cli-core';
import inquirer from 'inquirer';
import * as channelFCM from '../channel-fcm';
import { ChannelAction, ChannelConfigDeploymentType, IChannelAPIResponse } from '../channel-types';
import { ChannelType } from '../notifications-backend-cfg-channel-api';

const channelName = 'FCM';

const mockInquirer = (answers : $TSAny): $TSAny => {
  (inquirer as any).prompt = async (prompts:$TSAny):Promise<$TSAny> => {
    [].concat(prompts).forEach(prompt => {
      if (!((prompt as unknown as any).name in answers) && typeof (prompt as unknown as any).default !== 'undefined') {
        // eslint-disable-next-line no-param-reassign
        answers[(prompt as unknown as any).name] = (prompt as unknown as any).default;
      }
    });
    return answers;
  };
};

const mockPinpointResponseData = (status: boolean, action : ChannelAction): IChannelAPIResponse => ({
  action,
  channel: ChannelType.FCM,
  deploymentType: ChannelConfigDeploymentType.INLINE,
  output: undefined,
  response: {
    capability: AmplifyCategories.NOTIFICATIONS,
    pluginName: AmplifyCategories.NOTIFICATIONS,
    resourceProviderServiceName: AmplifySupportedService.PINPOINT,
    status,
    subCapability: ChannelType.FCM,
  },
});

const mockContext = (output: $TSAny, client: $TSAny): $TSContext => ({
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
}) as unknown as $TSContext;

const mockContextReject = (output:$TSAny, clientReject:$TSAny):$TSAny => ({
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
  const mockServiceOutput : Record<string, unknown> = {};
  const mockChannelEnabledOutput = { Enabled: true };
  mockServiceOutput[channelName] = mockChannelEnabledOutput;

  const mockPinpointResponseErr = new Error('channel-FCM.test.js error');

  const mockPinpointClient = {
    updateGcmChannel: jest.fn().mockImplementation(() => ({
      promise: jest.fn(() => mockPinpointResponseData(true, ChannelAction.ENABLE)),
    })),
  };

  const mockPinpointClientReject = {
    updateGcmChannel: jest.fn().mockImplementation(() => ({
      promise: jest.fn(() => {
        throw mockPinpointResponseErr;
      }),
    })),
  };

  test('configure', async () => {
    mockChannelEnabledOutput.Enabled = true;
    mockInquirer({ disableChannel: true });
    const mockContextObj = mockContext(mockChannelEnabledOutput, mockPinpointClient);
    await channelFCM.configure(mockContextObj).then(() => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
    });

    mockChannelEnabledOutput.Enabled = true;
    mockInquirer({ disableChannel: false });
    await channelFCM.configure(mockContext(mockChannelEnabledOutput, mockPinpointClient)).then(() => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
    });

    mockChannelEnabledOutput.Enabled = false;
    mockInquirer({ enableChannel: true });
    await channelFCM.configure(mockContext(mockChannelEnabledOutput, mockPinpointClient)).then(() => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
    });
  });

  test('enable', async () => {
    mockInquirer({ ApiKey: 'ApiKey-abc123' });
    const mockContextObj = mockContext(mockChannelEnabledOutput, mockPinpointClient);
    const data = await channelFCM.enable(mockContextObj, 'successMessage');
    expect(mockPinpointClient.updateGcmChannel).toBeCalled();
    expect(data).toEqual(mockPinpointResponseData(true, ChannelAction.ENABLE));
  });

  test('enable with newline', async () => {
    mockInquirer({ ApiKey: 'ApiKey-abc123\n' });
    const data = await channelFCM.enable(mockContext(mockChannelEnabledOutput, mockPinpointClient), 'successMessage');
    expect(mockPinpointClient.updateGcmChannel).toBeCalledWith(
      {
        ApplicationId: undefined,
        GCMChannelRequest: {
          ApiKey: 'ApiKey-abc123',
          Enabled: true,
        },
      },
    );
    expect(data).toEqual(mockPinpointResponseData(true, ChannelAction.ENABLE));
  });

  test('enable unsuccessful', async () => {
    mockInquirer({ ApiKey: 'ApiKey-abc123' });
    await expect(channelFCM.enable(mockContextReject(mockServiceOutput, mockPinpointClientReject), 'successMessage')).rejects.toThrowError('Failed to enable the FCM channel');
    expect(mockPinpointClient.updateGcmChannel).toBeCalled();
  });

  test('disable', async () => {
    const data = await channelFCM.disable(mockContextReject(mockServiceOutput, mockPinpointClient));
    expect(mockPinpointClient.updateGcmChannel).toBeCalled();
    expect(data).toEqual(mockPinpointResponseData(true, ChannelAction.DISABLE));
  });

  test('disable unsuccessful', async () => {
    await expect(channelFCM.disable(mockContextReject(mockServiceOutput, mockPinpointClientReject))).rejects.toThrowError('Failed to disable the FCM channel');
  });
});
