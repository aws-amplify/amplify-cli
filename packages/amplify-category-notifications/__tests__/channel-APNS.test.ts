/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable jest/no-conditional-expect */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable spellcheck/spell-checker */
import { $TSAny, $TSContext, IContextPrint } from 'amplify-cli-core';
import * as configureKey from '../src/apns-key-config';
import * as configureCertificate from '../src/apns-cert-config';

import * as channelAPNS from '../src/channel-APNS';
import { ICertificateInfo } from '../src/p12decoder';

const inquirer = require('inquirer');
const mockirer = require('mockirer');

const channelName = 'APNS';
jest.mock('../src/apns-key-config');
jest.mock('../src/apns-cert-config');

describe('channel-APNS', () => {
  const mockServiceOutput : $TSAny = {};
  const mockChannelOutput = { Enabled: true };
  mockServiceOutput[channelName] = mockChannelOutput;

  const mockPinpointResponseErr = {};
  const mockPinpointResponseData = {
    APNSChannelResponse: {},
  };
  const mockKeyConfig = {};
  const mockCertificateConfig = {};

  const mockPinpointClient = {
    updateApnsChannel: jest.fn(() => ({
      promise: () => new Promise((resolve, _) => {
        resolve(mockPinpointResponseData);
      }),
    })),
    updateApnsSandboxChannel: jest.fn(() => ({
      promise: () => new Promise((resolve, _) => {
        resolve(mockPinpointResponseData);
      }),
    })),
  };

  const mockPinpointClientReject = {
    updateApnsChannel: jest.fn(() => ({
      promise: () => new Promise((_, reject) => {
        reject(mockPinpointResponseErr);
      }),
    })),
    updateApnsSandboxChannel: jest.fn(() => ({
      promise: () => new Promise((_, reject) => {
        reject(mockPinpointResponseErr);
      }),
    })),
  };

  const mockContext: $TSContext = {
    exeInfo: {
      serviceMeta: {
        output: mockServiceOutput,
      },
      pinpointClient: mockPinpointClient,
    },
    print: {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as IContextPrint,
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

  beforeAll(() => {
    global.console = { ...global.console, log: jest.fn() };
    const configureKeyMock = configureKey as jest.Mocked<typeof configureKey>;
    const configureCertificateMock = configureCertificate as jest.Mocked<typeof configureCertificate>;

    configureKeyMock.run.mockImplementation(async () => mockKeyConfig);
    configureCertificateMock.run.mockImplementation(async () => mockCertificateConfig as ICertificateInfo);
  });

  beforeEach(() => {});

  test('configure', async () => {
    mockChannelOutput.Enabled = true;
    mockirer(inquirer, { disableChannel: true });
    await channelAPNS.configure(mockContext).then(() => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });

    mockChannelOutput.Enabled = true;
    mockirer(inquirer, { disableChannel: false });
    await channelAPNS.configure(mockContext).then(() => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });

    mockChannelOutput.Enabled = false;
    mockirer(inquirer, { enableChannel: true });
    await channelAPNS.configure(mockContext).then(() => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });
  });

  test('enable', async () => {
    mockirer(inquirer, { DefaultAuthenticationMethod: 'Certificate' });
    await channelAPNS.enable(mockContext, 'successMessage').then(data => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(mockPinpointClient.updateApnsSandboxChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });

    mockirer(inquirer, { DefaultAuthenticationMethod: 'Key' });
    await channelAPNS.enable(mockContext, 'successMessage').then(data => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(mockPinpointClient.updateApnsSandboxChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });
  });

  test('enable unsccessful', async () => {
    mockirer(inquirer, { DefaultAuthenticationMethod: 'Certificate' });
    await channelAPNS.enable(mockContextReject as unknown as $TSContext, 'successMessage').catch(err => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(err).toEqual(mockPinpointResponseErr);
    });

    mockirer(inquirer, { DefaultAuthenticationMethod: 'Key' });
    await channelAPNS.enable(mockContextReject as unknown as $TSContext, 'successMessage').catch(err => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(err).toEqual(mockPinpointResponseErr);
    });
  });

  test('disable', async () => {
    await channelAPNS.disable(mockContext).then(data => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(mockPinpointClient.updateApnsSandboxChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });
  });

  test('disable unsuccessful', async () => {
    await channelAPNS.disable(mockContextReject as unknown as $TSContext).catch(err => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(err).toEqual(mockPinpointResponseErr);
    });
  });
});
