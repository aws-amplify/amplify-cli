/* eslint-disable spellcheck/spell-checker */
import {
  $TSContext, $TSAny, AmplifyCategories, AmplifySupportedService,
} from 'amplify-cli-core';
import inquirer from 'inquirer';
import * as channelFCM from '../src/channel-FCM';
import { ChannelAction, ChannelConfigDeploymentType, IChannelAPIResponse } from '../src/channel-types';
import { ChannelCfg } from '../src/notifications-backend-cfg-channel-api';

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
  channel: ChannelCfg.ChannelType.FCM,
  deploymentType: ChannelConfigDeploymentType.INLINE,
  output: undefined,
  response: {
    capability: AmplifyCategories.NOTIFICATIONS,
    pluginName: AmplifyCategories.NOTIFICATIONS,
    resourceProviderServiceName: AmplifySupportedService.PINPOINT,
    status,
    subCapability: ChannelCfg.ChannelType.FCM,
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

class NoErrorThrownError extends Error {}

// wrapper to avoid conditional error checks
const getError = async <TError>(call: () => unknown): Promise<TError> => {
  try {
    await call();
    throw new NoErrorThrownError();
  } catch (error: unknown) {
    return error as TError;
  }
};

describe('channel-FCM', () => {
  const mockServiceOutput : Record<string, unknown> = {};
  const mockChannelEnabledOutput = { Enabled: true };
  mockServiceOutput[channelName] = mockChannelEnabledOutput;

  const mockPinpointResponseErr = new Error('channel-FCM.test.js error');

  const mockPinpointClient = {
    updateGcmChannel: jest.fn((_, cb) => new Promise(() => {
      cb(null, (mockPinpointResponseData(true, ChannelAction.ENABLE)));
    })),
  };

  const mockPinpointClientReject = {
    updateGcmChannel: jest.fn((_, cb) => new Promise(() => {
      cb(mockPinpointResponseErr);
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
      expect.anything(),
    );
    expect(data).toEqual(mockPinpointResponseData(true, ChannelAction.ENABLE));
  });

  // eslint-disable-next-line jest/no-focused-tests
  test('enable unsuccessful', async () => {
    mockInquirer({ ApiKey: 'ApiKey-abc123' });
    const err: IChannelAPIResponse = await getError(async () => channelFCM.enable(mockContextReject(mockServiceOutput, mockPinpointClientReject), 'successMessage'));
    expect(err.response.reasonMsg).toEqual(mockPinpointResponseErr.message);
    expect(mockPinpointClient.updateGcmChannel).toBeCalled();
  });

  test('disable', async () => {
    const data = await channelFCM.disable(mockContextReject(mockServiceOutput, mockPinpointClient));
    expect(mockPinpointClient.updateGcmChannel).toBeCalled();
    expect(data).toEqual(mockPinpointResponseData(true, ChannelAction.DISABLE));
  });

  test('disable unsuccessful', async () => {
    const err: IChannelAPIResponse = await getError(async () => channelFCM
      .disable(mockContextReject(mockServiceOutput, mockPinpointClientReject)));
    expect(err.response.reasonMsg).toEqual(mockPinpointResponseErr.message);
  });
});
