import { prompter } from '@aws-amplify/amplify-prompts';
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

const mockPinpointResponseData = (status: boolean, action: ChannelAction): IChannelAPIResponse => ({
  action,
  channel: ChannelType.Email,
  deploymentType: ChannelConfigDeploymentType.INLINE,
  output: undefined,
  response: {
    capability: AmplifyCategories.NOTIFICATIONS,
    pluginName: AmplifyCategories.NOTIFICATIONS,
    resourceProviderServiceName: AmplifySupportedService.PINPOINT,
    status,
    subCapability: ChannelType.Email,
  },
});

const mockPinpointClient = {
  updateEmailChannel: jest.fn().mockImplementation(() => ({
    promise: jest.fn(() => mockPinpointResponseData(true, ChannelAction.ENABLE)),
  })),
};

const mockContext = (output: $TSAny, client: $TSAny): $TSContext =>
  ({
    exeInfo: {
      serviceMeta: {
        output,
      },
      pinpointClient: client,
    },
    print: {
      info: jest.fn(),
      error: jest.fn(),
    },
  } as unknown as $TSContext);

describe('channel-FCM', () => {
  test('enable should store role arn', async () => {
    prompterMock.input.mockResolvedValueOnce('fake@email.com');
    prompterMock.input.mockResolvedValueOnce('fake:arn:identity');
    prompterMock.input.mockResolvedValueOnce('fake:arn:role');

    const mockContextObj = mockContext({ Enabled: true }, mockPinpointClient);
    const data = await channelEmail.enable(mockContextObj, 'successMessage');
    expect(mockPinpointClient.updateEmailChannel).toBeCalled();
    expect(data).toEqual(mockPinpointResponseData(true, ChannelAction.ENABLE));
    expect(mockContextObj.exeInfo.serviceMeta.output['Email'].RoleArn).toEqual('fake:arn:role');
  });
});
