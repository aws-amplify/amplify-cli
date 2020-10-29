const inquirer = require('inquirer');
const mockirer = require('mockirer');
const configureKey = require('../../lib/apns-key-config');
const configureCertificate = require('../../lib/apns-cert-config');

const channelName = 'APNS';

const channelAPNS = require('../../lib/channel-APNS');

describe('channel-APNS', () => {
  const mockServiceOutput = {};
  const mockChannelOutput = { Enabled: true };
  mockServiceOutput[channelName] = mockChannelOutput;

  const mockPinpointResponseErr = {};
  const mockPinpointResponseData = {
    APNSChannelResponse: {},
  };
  const mockKeyConfig = {};
  const mockCertificateConfig = {};

  const mockPinpointClient = {
    updateApnsChannel: jest.fn(() => {
      return {
        promise: () => {
          return new Promise((resolve, reject) => {
            resolve(mockPinpointResponseData);
          });
        },
      };
    }),
    updateApnsSandboxChannel: jest.fn(() => {
      return {
        promise: () => {
          return new Promise((resolve, reject) => {
            resolve(mockPinpointResponseData);
          });
        },
      };
    }),
  };

  const mockPinpointClientReject = {
    updateApnsChannel: jest.fn(() => {
      return {
        promise: () => {
          return new Promise((resolve, reject) => {
            reject(mockPinpointResponseErr);
          });
        },
      };
    }),
    updateApnsSandboxChannel: jest.fn(() => {
      return {
        promise: () => {
          return new Promise((resolve, reject) => {
            reject(mockPinpointResponseErr);
          });
        },
      };
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

  beforeAll(() => {
    global.console = { log: jest.fn() };
    configureKey.run = jest.fn(() => {
      return mockKeyConfig;
    });
    configureCertificate.run = jest.fn(() => {
      return mockCertificateConfig;
    });
  });

  beforeEach(() => {});

  test('configure', () => {
    mockChannelOutput.Enabled = true;
    mockirer(inquirer, { disableChannel: true });
    channelAPNS.configure(mockContext).then(() => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });

    mockChannelOutput.Enabled = true;
    mockirer(inquirer, { disableChannel: false });
    channelAPNS.configure(mockContext).then(() => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });

    mockChannelOutput.Enabled = false;
    mockirer(inquirer, { enableChannel: true });
    channelAPNS.configure(mockContext).then(() => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });
  });

  test('enable', async () => {
    mockirer(inquirer, { DefaultAuthenticationMethod: 'Certificate' });
    channelAPNS.enable(mockContext, 'successMessage').then(data => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(mockPinpointClient.updateApnsSandboxChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });

    mockirer(inquirer, { DefaultAuthenticationMethod: 'Key' });
    channelAPNS.enable(mockContext, 'successMessage').then(data => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(mockPinpointClient.updateApnsSandboxChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });
  });

  test('enable unsccessful', async () => {
    mockirer(inquirer, { DefaultAuthenticationMethod: 'Certificate' });
    channelAPNS.enable(mockContextReject, 'successMessage').catch(err => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(err).toEqual(mockPinpointResponseErr);
    });

    mockirer(inquirer, { DefaultAuthenticationMethod: 'Key' });
    channelAPNS.enable(mockContextReject, 'successMessage').catch(err => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(err).toEqual(mockPinpointResponseErr);
    });
  });

  test('disable', () => {
    channelAPNS.disable(mockContext).then(data => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(mockPinpointClient.updateApnsSandboxChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });
  });

  test('disable unsuccessful', () => {
    channelAPNS.disable(mockContextReject).catch(err => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(err).toEqual(mockPinpointResponseErr);
    });
  });
});
