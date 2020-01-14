const inquirer = require('inquirer');
const mockirer = require('mockirer');
const configureKey = require('../../lib/apns-key-config');
const configureCertificate = require('../../lib/apns-cert-config');

const channelName = 'APNS';

const channelAPNS = require('../../lib/channel-APNS');

describe('channel-APNS', () => {
  const mockServiceOutput = {};
  const mockChannelOutput = { Enabled: true };
  const mockPinpointResponseErr = {};
  const mockPinpointResponseData = {
    APNSChannelResponse: {},
  };
  const mockKeyConfig = {};
  const mockCertificateConfig = {};
  const mockPinpointClient = {
    updateApnsChannel: jest.fn((_, callback) => {
      callback(null, mockPinpointResponseData);
    }),
  };
  mockServiceOutput[channelName] = mockChannelOutput;

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
    mockPinpointClient.updateApnsChannel = jest.fn((_, callback) => {
      callback(null, mockPinpointResponseData);
    });

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
    mockPinpointClient.updateApnsChannel = jest.fn((_, callback) => {
      callback(null, mockPinpointResponseData);
    });

    mockirer(inquirer, { DefaultAuthenticationMethod: 'Certificate' });
    channelAPNS.enable(mockContext, 'successMessage').then(() => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });

    mockirer(inquirer, { DefaultAuthenticationMethod: 'Key' });
    channelAPNS.enable(mockContext, 'successMessage').then(() => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });
  });

  test('enable unsccessful', async () => {
    mockPinpointClient.updateApnsChannel = jest.fn((_, callback) => {
      callback(mockPinpointResponseErr, mockPinpointResponseData);
    });

    mockirer(inquirer, { DefaultAuthenticationMethod: 'Certificate' });
    channelAPNS.enable(mockContext, 'successMessage').catch(err => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });

    mockirer(inquirer, { DefaultAuthenticationMethod: 'Key' });
    channelAPNS.enable(mockContext, 'successMessage').catch(err => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });
  });

  test('disable', () => {
    mockPinpointClient.updateApnsChannel = jest.fn((_, callback) => {
      callback(null, mockPinpointResponseData);
    });
    channelAPNS.disable(mockContext).then(() => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });

    mockPinpointClient.updateApnsChannel = jest.fn((_, callback) => {
      callback(mockPinpointResponseErr, mockPinpointResponseData);
    });
    channelAPNS.disable(mockContext).catch(() => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });
  });
});
