/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable jest/no-conditional-expect */
/* eslint-disable no-param-reassign */
import { $TSContext, $TSAny } from 'amplify-cli-core';
import * as channelFCM from '../src/channel-FCM';

const inquirer = require('inquirer');

const channelName = 'FCM';

const mockInquirer = (answers : $TSAny): $TSAny => {
  inquirer.prompt = async (prompts:$TSAny):Promise<$TSAny> => {
    [].concat(prompts).forEach((question:$TSAny) => {
      if (!(question.name in answers) && typeof question.default !== 'undefined') {
        answers[question.name] = question.default;
      }
    });

    return answers;
  };
};

describe('channel-FCM', () => {
  const mockServiceOutput : Record<string, unknown> = {};
  const mockChannelOutput = { Enabled: true };
  mockServiceOutput[channelName] = mockChannelOutput;

  const mockPinpointResponseErr = new Error('channel-FCM.test.js error');
  const mockPinpointResponseData = {
    FCMChannelResponse: {},
  };

  const mockPinpointClient = {
    updateGcmChannel: jest.fn((_, cb) => new Promise(() => {
      cb(null, mockPinpointResponseData);
    })),
  };

  const mockPinpointClientReject = {
    updateGcmChannel: jest.fn((_, cb) => new Promise(() => {
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
  } as unknown as $TSContext;

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

    await channelFCM.configure(mockContext).then(() => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
    });

    mockChannelOutput.Enabled = true;
    mockInquirer({ disableChannel: false });
    await channelFCM.configure(mockContext).then(() => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
    });

    mockChannelOutput.Enabled = false;
    mockInquirer({ enableChannel: true });
    await channelFCM.configure(mockContext).then(() => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
    });
  });

  test('enable', async () => {
    mockInquirer({ ApiKey: 'ApiKey-abc123' });
    await channelFCM.enable(mockContext, 'successMessage').then(data => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });
  });

  test('enable with newline', async () => {
    mockInquirer({ ApiKey: 'ApiKey-abc123\n' });
    await channelFCM.enable(mockContext as unknown as $TSContext, 'successMessage').then(data => {
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
    await channelFCM.enable(mockContextReject as unknown as $TSContext, 'successMessage').catch(err => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
      expect(err).toEqual(mockPinpointResponseErr);
    });
  });

  test('disable', async () => {
    await channelFCM.disable(mockContext as unknown as $TSContext).then(data => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });
  });

  test('disable unsuccessful', async () => {
    await expect(channelFCM.disable(mockContextReject as unknown as $TSContext)).rejects.toThrow(mockPinpointResponseErr);
  });
});
