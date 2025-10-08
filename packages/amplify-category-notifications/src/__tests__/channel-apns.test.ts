import { $TSAny, $TSContext, AmplifyCategories, AmplifyFault, AmplifySupportedService, IContextPrint } from '@aws-amplify/amplify-cli-core';
import { prompter } from '@aws-amplify/amplify-prompts';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { PinpointClient, UpdateApnsChannelCommand, UpdateApnsSandboxChannelCommand } from '@aws-sdk/client-pinpoint';
import * as configureKey from '../apns-key-config';
import * as configureCertificate from '../apns-cert-config';

import * as channelAPNS from '../channel-apns';
import { ICertificateInfo } from '../apns-cert-p12decoder';
import { ChannelAction, ChannelConfigDeploymentType, IChannelAPIResponse } from '../channel-types';
import { ChannelType } from '../notifications-backend-cfg-channel-api';

const channelName = 'APNS';
jest.mock('../apns-key-config');
jest.mock('../apns-cert-config');
jest.mock('@aws-amplify/amplify-prompts');
const prompterMock = prompter as jest.Mocked<typeof prompter>;

const mockPinpointClient = mockClient(PinpointClient as any);

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

jest.mock('@aws-amplify/amplify-cli-core', () => {
  return {
    ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
    FeatureFlags: {
      getBoolean: jest.fn(),
      getNumber: jest.fn(),
      getObject: jest.fn(),
      getString: jest.fn(),
    },
  };
});

describe('channel-APNS', () => {
  const mockServiceOutput: $TSAny = {};
  const mockChannelOutput = { Enabled: true };
  mockServiceOutput[channelName] = mockChannelOutput;

  const mockPinpointResponseErr = new Error('channel-APNS.test.js error');
  const mockPinpointResponseData = {
    APNSChannelResponse: { Enabled: true, ApplicationId: 'test-app-id' },
  };

  const mockAPNSChannelResponseData = (status: boolean, action: ChannelAction, output: $TSAny): IChannelAPIResponse => ({
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
  });

  const mockKeyConfig = {};
  const mockCertificateConfig = {};

  const mockContext: $TSContext = {
    exeInfo: {
      serviceMeta: {
        output: mockServiceOutput,
      },
      pinpointClient: mockPinpointClient as any,
    },
    print: {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as IContextPrint,
  } as unknown as $TSContext;

  beforeEach(() => {
    mockPinpointClient.reset();
  });

  beforeAll(() => {
    global.console = { ...global.console, log: jest.fn() };
    const configureKeyMock = configureKey as jest.Mocked<typeof configureKey>;
    const configureCertificateMock = configureCertificate as jest.Mocked<typeof configureCertificate>;

    configureKeyMock.run.mockImplementation(async () => mockKeyConfig);
    configureCertificateMock.run.mockImplementation(async () => mockCertificateConfig as ICertificateInfo);
  });

  test('configure', async () => {
    mockPinpointClient.on(UpdateApnsChannelCommand as any).resolves(mockPinpointResponseData as any);
    mockPinpointClient.on(UpdateApnsSandboxChannelCommand as any).resolves(mockPinpointResponseData as any);

    mockChannelOutput.Enabled = true;
    prompterMock.yesOrNo.mockResolvedValueOnce(true);
    await channelAPNS.configure(mockContext);
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateApnsChannelCommand as any);

    mockChannelOutput.Enabled = true;
    prompterMock.yesOrNo.mockResolvedValueOnce(false);
    prompterMock.pick.mockResolvedValueOnce('Certificate');
    await channelAPNS.configure(mockContext);
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateApnsChannelCommand as any);

    mockChannelOutput.Enabled = false;
    prompterMock.yesOrNo.mockResolvedValueOnce(true);
    prompterMock.pick.mockResolvedValueOnce('Certificate');
    await channelAPNS.configure(mockContext);
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateApnsChannelCommand as any);
  });

  test('enable', async () => {
    mockPinpointClient.on(UpdateApnsChannelCommand as any).resolves(mockPinpointResponseData as any);
    mockPinpointClient.on(UpdateApnsSandboxChannelCommand as any).resolves(mockPinpointResponseData as any);

    prompterMock.pick.mockResolvedValueOnce('Certificate');
    const disableData = await channelAPNS.enable(mockContext, 'successMessage');
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateApnsChannelCommand as any);
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateApnsSandboxChannelCommand as any);
    expect(disableData).toEqual(mockAPNSChannelResponseData(true, ChannelAction.ENABLE, mockPinpointResponseData.APNSChannelResponse));

    prompterMock.pick.mockResolvedValueOnce('Key');
    const enableData = await channelAPNS.enable(mockContext, 'successMessage');
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateApnsChannelCommand as any);
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateApnsSandboxChannelCommand as any);
    expect(enableData).toEqual(mockAPNSChannelResponseData(true, ChannelAction.ENABLE, mockPinpointResponseData.APNSChannelResponse));
  });

  test('enable unsuccessful', async () => {
    mockPinpointClient.on(UpdateApnsChannelCommand as any).rejects(mockPinpointResponseErr);

    prompterMock.pick.mockResolvedValueOnce('Certificate');
    const errCert: AmplifyFault = await getError(async () => channelAPNS.enable(mockContext, 'successMessage'));
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateApnsChannelCommand as any);
    expect(errCert?.downstreamException?.message).toContain(mockPinpointResponseErr.message);

    prompterMock.pick.mockResolvedValueOnce('Key');
    const errKey: AmplifyFault = await getError(async () => channelAPNS.enable(mockContext, 'successMessage'));
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateApnsChannelCommand as any);
    expect(errKey?.downstreamException?.message).toContain(mockPinpointResponseErr.message);
  });

  test('disable', async () => {
    mockPinpointClient.on(UpdateApnsChannelCommand as any).resolves(mockPinpointResponseData as any);
    mockPinpointClient.on(UpdateApnsSandboxChannelCommand as any).resolves(mockPinpointResponseData as any);

    const data = await channelAPNS.disable(mockContext);
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateApnsChannelCommand as any);
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateApnsSandboxChannelCommand as any);
    expect(data).toEqual(mockAPNSChannelResponseData(true, ChannelAction.DISABLE, mockPinpointResponseData.APNSChannelResponse));
  });

  test('disable unsuccessful', async () => {
    mockPinpointClient.on(UpdateApnsChannelCommand as any).rejects(mockPinpointResponseErr);

    const errKey: AmplifyFault = await getError(async () => channelAPNS.disable(mockContext));
    expect(mockPinpointClient).toHaveReceivedCommand(UpdateApnsChannelCommand as any);
    expect(errKey?.downstreamException?.message).toContain(mockPinpointResponseErr.message);
  });
});
