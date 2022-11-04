/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable jest/no-conditional-expect */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable spellcheck/spell-checker */
import {
  $TSAny, $TSContext, AmplifyCategories, AmplifyFault, AmplifySupportedService, IContextPrint,
} from 'amplify-cli-core';
import * as configureKey from '../apns-key-config';
import * as configureCertificate from '../apns-cert-config';

import * as channelAPNS from '../channel-apns';
import { ICertificateInfo } from '../apns-cert-p12decoder';
import { ChannelAction, ChannelConfigDeploymentType, IChannelAPIResponse } from '../channel-types';
import { ChannelType } from '../notifications-backend-cfg-channel-api';

const inquirer = require('inquirer');
const mockirer = require('mockirer');

const channelName = 'APNS';
jest.mock('../apns-key-config');
jest.mock('../apns-cert-config');

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

describe('channel-APNS', () => {
  const mockServiceOutput : $TSAny = {};
  const mockChannelOutput = { Enabled: true };
  mockServiceOutput[channelName] = mockChannelOutput;

  const mockPinpointResponseErr = new Error('channel-APNS.test.js error');
  const mockPinpointResponseData = {
    APNSChannelResponse: {},
  };

  const mockAPNSChannelResponseData = (status: boolean, action: ChannelAction, output : $TSAny):IChannelAPIResponse => ({
    action,
    channel: ChannelType.APNS,
    deploymentType: ChannelConfigDeploymentType.INLINE,
    output,
    response: {
      capability: AmplifyCategories.NOTIFICATIONS,
      pluginName: AmplifyCategories.NOTIFICATIONS,
      resourceProviderServiceName: AmplifySupportedService.PINPOINT,
      status,
      subCapability: ChannelType.APNS,
    },
  }
  );

  const mockKeyConfig = {};
  const mockCertificateConfig = {};

  const mockPinpointClient = {
    updateApnsChannel: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue(mockPinpointResponseData),
    }),
    updateApnsSandboxChannel: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue(mockPinpointResponseData),
    }),
  };

  const mockPinpointClientReject = {
    updateApnsChannel: jest.fn().mockReturnValue({
      promise: jest.fn().mockRejectedValue(mockPinpointResponseErr),
    }),
    updateApnsSandboxChannel: jest.fn().mockReturnValue({
      promise: jest.fn().mockRejectedValue(mockPinpointResponseErr),
    }),
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
      expect(data).toEqual(mockAPNSChannelResponseData(true, ChannelAction.ENABLE, mockPinpointResponseData.APNSChannelResponse));
    });

    mockirer(inquirer, { DefaultAuthenticationMethod: 'Key' });
    await channelAPNS.enable(mockContext, 'successMessage').then(data => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(mockPinpointClient.updateApnsSandboxChannel).toBeCalled();
      expect(data).toEqual(mockAPNSChannelResponseData(true, ChannelAction.ENABLE, mockPinpointResponseData.APNSChannelResponse));
    });
  });

  // eslint-disable-next-line jest/no-focused-tests
  test('enable unsuccessful', async () => {
    mockirer(inquirer, { DefaultAuthenticationMethod: 'Certificate' });
    const errCert: AmplifyFault = await getError(async () => channelAPNS.enable(mockContextReject as unknown as $TSContext, 'successMessage'));
    expect(mockContextReject.exeInfo.pinpointClient.updateApnsChannel).toBeCalled();
    expect(errCert?.downstreamException?.message).toContain(mockPinpointResponseErr.message);

    mockirer(inquirer, { DefaultAuthenticationMethod: 'Key' });
    const errKey: AmplifyFault = await getError(async () => channelAPNS.enable(mockContextReject as unknown as $TSContext, 'successMessage'));
    expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    expect(errKey?.downstreamException?.message).toContain(mockPinpointResponseErr.message);
  });

  test('disable', async () => {
    await channelAPNS.disable(mockContext).then(data => {
      expect(mockPinpointClient.updateApnsChannel).toBeCalled();
      expect(mockPinpointClient.updateApnsSandboxChannel).toBeCalled();
      expect(data).toEqual(mockAPNSChannelResponseData(true, ChannelAction.DISABLE, mockPinpointResponseData.APNSChannelResponse));
    });
  });

  test('disable unsuccessful', async () => {
    const errKey: AmplifyFault = await getError(async () => channelAPNS.disable(mockContextReject as unknown as $TSContext));
    expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    expect(errKey?.downstreamException?.message).toContain(mockPinpointResponseErr.message);
  });
});
