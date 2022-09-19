/* eslint-disable jest/no-conditional-expect */
/* eslint-disable spellcheck/spell-checker */
import { $TSAny } from 'amplify-cli-core';
import inquirer from 'inquirer';
import * as channelFCM from '../channel-FCM';

const channelName = 'FCM';

const mockInquirer = (answers : $TSAny): $TSAny => {
  (inquirer as any).prompt = async (prompts: $TSAny):Promise<$TSAny> => {
    [].concat(prompts).forEach(prompt => {
      if (!((prompt as unknown as any).name in answers) && typeof (prompt as unknown as any).default !== 'undefined') {
        // eslint-disable-next-line no-param-reassign
        answers[(prompt as unknown as any).name] = (prompt as unknown as any).default;
      }
    });
    return answers;
  };
};

describe('channel-FCM', () => {
  const mockServiceOutput: $TSAny = {};
  const mockChannelOutput: $TSAny = { Enabled: true };
  mockServiceOutput[channelName] = mockChannelOutput;

  const mockPinpointResponseErr = new Error('channel-FCM.test.js error');
  const mockPinpointResponseData = {
    FCMChannelResponse: {},
  };

  const mockPinpointClient = {
    updateGcmChannel: jest.fn((__, cb) => new Promise(() => {
      cb(null, mockPinpointResponseData);
    })),
  };

  const mockPinpointClientReject = {
    updateGcmChannel: jest.fn((__, cb) => new Promise(() => {
      cb(mockPinpointResponseErr);
    })),
  };

  const mockContext = {
    exeInfo: {
      serviceMeta: {
        output: mockServiceOutput,
      },
      pinpointClient: mockPinpointClient,
    },
    print: {
      info: jest.fn(),
      error: jest.fn(),
    },
  };

  const mockContextReject = {
    exeInfo: {
      serviceMeta: {
        output: mockServiceOutput,
      },
      pinpointClient: mockPinpointClientReject,
    },
    print: {
      info: jest.fn(),
      error: jest.fn(),
    },
  };

  test('configure', async () => {
    mockChannelOutput.Enabled = true;
    mockInquirer({ disableChannel: true });

    await channelFCM.configure(mockContext as $TSAny).then(() => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
    });

    mockChannelOutput.Enabled = true;
    mockInquirer({ disableChannel: false });
    await channelFCM.configure(mockContext as $TSAny).then(() => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
    });

    mockChannelOutput.Enabled = false;
    mockInquirer({ enableChannel: true });
    await channelFCM.configure(mockContext as $TSAny).then(() => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
    });
  });

  test('enable', async () => {
    mockInquirer({ ApiKey: 'ApiKey-abc123' });
    await channelFCM.enable(mockContext as $TSAny, 'successMessage').then(data => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });
  });

  test('enable with newline', async () => {
    mockInquirer({ ApiKey: 'ApiKey-abc123\n' });
    await channelFCM.enable(mockContext as $TSAny, 'successMessage').then(data => {
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
      expect(data).toEqual(mockPinpointResponseData);
    });
  });

  test('enable unsuccessful', async () => {
    mockInquirer({ ApiKey: 'ApiKey-abc123' });
    await channelFCM.enable(mockContextReject as $TSAny, 'successMessage').catch(err => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
      expect(err).toEqual(mockPinpointResponseErr);
    });
  });

  test('disable', async () => {
    await channelFCM.disable(mockContext as $TSAny).then(data => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });
  });

  test('disable unsuccessful', async () => {
    await expect(channelFCM.disable(mockContextReject as $TSAny)).rejects.toThrow(mockPinpointResponseErr);
  });
});
