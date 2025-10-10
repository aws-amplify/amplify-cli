import { prompter } from '@aws-amplify/amplify-prompts';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { PinpointClient, UpdateEmailChannelCommand } from '@aws-sdk/client-pinpoint';
import * as channelEmail from '../channel-email';
import { ChannelAction, ChannelConfigDeploymentType, IChannelAPIResponse } from '../channel-types';
import { $TSAny, $TSContext, AmplifyCategories, AmplifySupportedService } from '@aws-amplify/amplify-cli-core';
import { ChannelType } from '../notifications-backend-cfg-channel-api';

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

jest.mock('@aws-amplify/amplify-prompts');
const prompterMock = prompter as jest.Mocked<typeof prompter>;

const mockPinpointClient = mockClient(PinpointClient);

const mockPinpointResponseData = (status: boolean, action: ChannelAction, output: any): IChannelAPIResponse => ({
  action,
  channel: ChannelType.Email,
  deploymentType: ChannelConfigDeploymentType.INLINE,
  output,
  response: {
    capability: AmplifyCategories.NOTIFICATIONS,
    pluginName: AmplifyCategories.NOTIFICATIONS,
    resourceProviderServiceName: AmplifySupportedService.PINPOINT,
    status,
    subCapability: ChannelType.Email,
  },
});

const mockContext = (output: $TSAny): $TSContext =>
  ({
    exeInfo: {
      serviceMeta: {
        output,
      },
      pinpointClient: mockPinpointClient as unknown as PinpointClient,
    },
    print: {
      info: jest.fn(),
      error: jest.fn(),
    },
  } as unknown as $TSContext);

describe('channel-Email', () => {
  const mockEmailChannelResponse = {
    Enabled: true,
    ApplicationId: 'test-app-id',
    Platform: 'EMAIL' as const,
  };

  beforeEach(() => {
    mockPinpointClient.reset();
  });

  test('enable should store role arn', async () => {
    mockPinpointClient.on(UpdateEmailChannelCommand).resolves({ EmailChannelResponse: mockEmailChannelResponse });
    prompterMock.input.mockResolvedValueOnce('fake@email.com');
    prompterMock.input.mockResolvedValueOnce('fake:arn:identity');
    prompterMock.input.mockResolvedValueOnce('fake:arn:role');

    const mockContextObj = mockContext({ Enabled: true });
    const data = await channelEmail.enable(mockContextObj, 'successMessage');
    expect(mockPinpointClient).toHaveReceivedCommandWith(UpdateEmailChannelCommand, {
      ApplicationId: undefined,
      EmailChannelRequest: {
        FromAddress: 'fake@email.com',
        Identity: 'fake:arn:identity',
        RoleArn: 'fake:arn:role',
        Enabled: true,
      },
    });
    expect(data).toEqual(mockPinpointResponseData(true, ChannelAction.ENABLE, mockEmailChannelResponse));
    expect(mockContextObj.exeInfo.serviceMeta.output['Email'].RoleArn).toEqual('fake:arn:role');
  });
});
