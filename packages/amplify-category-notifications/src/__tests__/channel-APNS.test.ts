/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/namespace */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable jest/valid-expect-in-promise */
/* eslint-disable jest/no-conditional-expect */
import { $TSAny } from 'amplify-cli-core';
import * as configureKey from '../apns-key-config';
import * as configureCertificate from '../apns-cert-config';
import * as channelAPNS from '../channel-APNS';

const inquirer = require('inquirer');
const mockirer = require('mockirer');

const channelName = 'APNS';

describe('channel-APNS', () => {
  const mockServiceOutput: $TSAny = {};
  const mockChannelOutput: $TSAny = { Enabled: true };
  mockServiceOutput[channelName] = mockChannelOutput;

  const mockPinpointResponseErr = {};
  const mockPinpointResponseData = {
    APNSChannelResponse: {},
  };
  const mockKeyConfig = {};
  const mockCertificateConfig = {};

  const mockPinpointClient = {
    updateApnsChannel: jest.fn(() => ({
      promise: () => new Promise((resolve, __reject) => {
        resolve(mockPinpointResponseData);
      }),
    })),
    updateApnsSandboxChannel: jest.fn(() => ({
      promise: () => new Promise((resolve, __reject) => {
        resolve(mockPinpointResponseData);
      }),
    })),
  };

  const mockPinpointClientReject = {
    updateApnsChannel: jest.fn(() => ({
      promise: () => new Promise((__resolve, reject) => {
        reject(mockPinpointResponseErr);
      }),
    })),
    updateApnsSandboxChannel: jest.fn(() => ({
      promise: () => new Promise((__resolve, reject) => {
        reject(mockPinpointResponseErr);
      }),
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

  beforeAll(() => {
    (global as $TSAny).console = { log: jest.fn() };
    (configureKey as $TSAny).run = jest.fn(() => mockKeyConfig);
    (configureCertificate as $TSAny).run = jest.fn(() => mockCertificateConfig);
  });

  test('configure', () => {
    mockChannelOutput.Enabled = true;
    mockirer(inquirer, { disableChannel: true });
    channelAPNS.configure(mockContext as $TSAny).then(() => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });

    mockChannelOutput.Enabled = true;
    mockirer(inquirer, { disableChannel: false });
    channelAPNS.configure(mockContext as $TSAny).then(() => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });

    mockChannelOutput.Enabled = false;
    mockirer(inquirer, { enableChannel: true });
    channelAPNS.configure(mockContext as $TSAny).then(() => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });
  });

  test('enable', async () => {
    mockirer(inquirer, { DefaultAuthenticationMethod: 'Certificate' });
    channelAPNS.enable(mockContext as $TSAny, 'successMessage').then(data => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(mockPinpointClient.updateApnsSandboxChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });

    mockirer(inquirer, { DefaultAuthenticationMethod: 'Key' });
    channelAPNS.enable(mockContext as $TSAny, 'successMessage').then(data => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(mockPinpointClient.updateApnsSandboxChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });
  });

  test('enable unsuccessful', async () => {
    mockirer(inquirer, { DefaultAuthenticationMethod: 'Certificate' });
    channelAPNS.enable(mockContextReject as $TSAny, 'successMessage').catch(err => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(err).toEqual(mockPinpointResponseErr);
    });

    mockirer(inquirer, { DefaultAuthenticationMethod: 'Key' });
    channelAPNS.enable(mockContextReject as $TSAny, 'successMessage').catch(err => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(err).toEqual(mockPinpointResponseErr);
    });
  });

  test('disable', () => {
    channelAPNS.disable(mockContext as $TSAny).then(data => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(mockPinpointClient.updateApnsSandboxChannel).toBeCalled();
      expect(data).toEqual(mockPinpointResponseData);
    });
  });

  test('disable unsuccessful', () => {
    channelAPNS.disable(mockContextReject as $TSAny).catch(err => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(err).toEqual(mockPinpointResponseErr);
    });
  });
});
