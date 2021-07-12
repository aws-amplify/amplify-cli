const inquirer = require('inquirer');
const channelName = 'FCM';
const channelFCM = require('../../lib/channel-FCM');

const mockInquirer = answers => {
  inquirer.prompt = async prompts => {
    [].concat(prompts).forEach(function (prompt) {
      if (!(prompt.name in answers) && typeof prompt.default !== 'undefined') {
        answers[prompt.name] = prompt.default;
      }
    });

    return answers;
  };
};

describe('channel-FCM', () => {
  const mockServiceOutput = {};
  const mockChannelOutput = { Enabled: true };
  mockServiceOutput[channelName] = mockChannelOutput;

  const mockPinpointResponseErr = new Error('channel-FCM.test.js error');
  const mockPinpointResponseData = {
    FCMChannelResponse: {},
  };

  const mockPinpointClient = {
    updateGcmChannel: jest.fn((_, cb) => {
      return new Promise(() => {
        cb(null, mockPinpointResponseData);
      });
    }),
  };

  const mockPinpointClientReject = {
    updateGcmChannel: jest.fn((_, cb) => {
      return new Promise(() => {
        cb(mockPinpointResponseErr);
      });
    }),
  };

  let mockContext = {
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

  let mockContextReject = {
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
    await channelFCM.enable(mockContext, 'successMessage').then(data => {
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
    await channelFCM.enable(mockContextReject, 'successMessage').catch(err => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
      expect(err).toEqual(mockPinpointResponseErr);
    });
  });

  test('disable', async () => {
    await channelFCM.disable(mockContext).then(data => {
      expect(mockPinpointClient.updateGcmChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });
  });

  test('disable unsuccessful', async () => {
    await expect(channelFCM.disable(mockContextReject)).rejects.toThrow(mockPinpointResponseErr);
  });
});
