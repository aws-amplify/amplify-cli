import {
  $TSContext,
  AmplifyCategories,
  AmplifySupportedService,
  INotificationsResourceMeta,
  IPluginCapabilityAPIResponse,
  NotificationChannels,
} from '@aws-amplify/amplify-cli-core';
import ora from 'ora';

import { prompter } from '@aws-amplify/amplify-prompts';
import * as channel from '../channel-in-app-msg';
import * as ChannelCfg from '../notifications-backend-cfg-channel-api';
import * as Meta from '../notifications-amplify-meta-api';
import * as Cfg from '../notifications-backend-cfg-api';
import { ChannelAction, ChannelConfigDeploymentType } from '../channel-types';
import { INotificationsResourceBackendConfig } from '../notifications-backend-cfg-types';
import { buildPinpointChannelResponseSuccess, getPinpointAppStatusFromMeta } from '../pinpoint-helper';
import * as analyticsClient from '../plugin-client-api-analytics';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  FeatureFlags: {
    getBoolean: jest.fn(),
    getNumber: jest.fn(),
    getObject: jest.fn(),
    getString: jest.fn(),
  },
  stateManager: {
    getCurrentBackendConfig: jest.fn(),
    getCurrentEnvName: jest.fn(),
    getCurrentMeta: jest.fn(),
  },
}));

jest.mock('ora', () => {
  const mockSpinnerInstance = {
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn(),
    stop: jest.fn(),
  };
  return jest.fn(() => mockSpinnerInstance);
});
jest.mock('../notifications-api');
jest.mock('../pinpoint-helper');
jest.mock('../plugin-client-api-analytics');

const channelName = 'InAppMessaging';

const getAppConfigSpy = jest.spyOn(Cfg, 'getNotificationsAppConfig');
const getAppMetaSpy = jest.spyOn(Meta, 'getNotificationsAppMeta');
const isChannelEnabledSpy = jest.spyOn(ChannelCfg, 'isChannelEnabledNotificationsBackendConfig');
const prompterYesOrNoSpy = jest.spyOn(prompter, 'yesOrNo');
const invokeAnalyticsPinpointHasInAppMessagingPolicySpy = jest.spyOn(analyticsClient, 'invokeAnalyticsPinpointHasInAppMessagingPolicy');

const mockContext = {
  print: { info: jest.fn(), error: jest.fn() },
  exeInfo: { amplifyMeta: {} },
} as unknown as $TSContext;
const mockBuildPinpointChannelResponseSuccess = buildPinpointChannelResponseSuccess as jest.Mock;
const mockGetPinpointAppStatusFromMeta = getPinpointAppStatusFromMeta as jest.Mock;
const mockInvokeAnalyticsResourceToggleNotificationChannel = analyticsClient.invokeAnalyticsResourceToggleNotificationChannel as jest.Mock;
const mockPinpointApp: any = { Id: 'app-id', Name: 'app-name' };
const mockSpinner = ora();

const getMockAnalyticsAPIResponse = ({ status }: { status: boolean }): IPluginCapabilityAPIResponse => ({
  pluginName: AmplifyCategories.ANALYTICS,
  resourceProviderServiceName: AmplifySupportedService.PINPOINT,
  capability: AmplifyCategories.NOTIFICATIONS,
  subCapability: NotificationChannels.IN_APP_MSG,
  status,
});

describe('channel-InAppMessaging', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('configure', () => {
    beforeEach(() => {
      mockInvokeAnalyticsResourceToggleNotificationChannel.mockResolvedValue(getMockAnalyticsAPIResponse({ status: true }));
    });

    describe('enabled channel', () => {
      beforeEach(() => {
        isChannelEnabledSpy.mockResolvedValue(true);
        invokeAnalyticsPinpointHasInAppMessagingPolicySpy.mockResolvedValue(true);
      });

      test('user choosing to disable the channel', async () => {
        prompterYesOrNoSpy.mockResolvedValue(true);
        await channel.configure(mockContext);
        expect(prompterYesOrNoSpy).toBeCalledWith('Do you want to disable the In-App Messaging channel', false);
        expect(mockSpinner.succeed).toBeCalled();
      });

      test('user choosing not to disable the channel', async () => {
        prompterYesOrNoSpy.mockResolvedValue(false);
        await channel.configure(mockContext);
        expect(prompterYesOrNoSpy).toBeCalledWith('Do you want to disable the In-App Messaging channel', false);
        expect(mockSpinner.start).not.toBeCalled();
      });
    });

    describe('disabled channel', () => {
      beforeEach(() => {
        isChannelEnabledSpy.mockResolvedValue(false);
        invokeAnalyticsPinpointHasInAppMessagingPolicySpy.mockResolvedValue(true);
      });

      test('user choosing to enable the channel', async () => {
        mockGetPinpointAppStatusFromMeta.mockResolvedValue({});
        prompterYesOrNoSpy.mockResolvedValue(true);
        await channel.configure(mockContext);
        expect(prompterYesOrNoSpy).toBeCalledWith('Do you want to enable the In-App Messaging channel', true);
        expect(mockSpinner.succeed).toBeCalled();
      });

      test('user choosing not to enable the channel', async () => {
        prompterYesOrNoSpy.mockResolvedValue(false);
        await channel.configure(mockContext);
        expect(prompterYesOrNoSpy).toBeCalledWith('Do you want to enable the In-App Messaging channel', true);
        expect(mockSpinner.start).not.toBeCalled();
      });
    });
  });

  describe('enable', () => {
    beforeEach(() => {
      mockGetPinpointAppStatusFromMeta.mockResolvedValue({});
      invokeAnalyticsPinpointHasInAppMessagingPolicySpy.mockResolvedValue(true);
    });

    test('returns successful API response', async () => {
      const mockAPIResponse = getMockAnalyticsAPIResponse({ status: true });
      mockInvokeAnalyticsResourceToggleNotificationChannel.mockResolvedValue(mockAPIResponse);
      const response = await channel.enable(mockContext);
      expect(mockSpinner.succeed).toBeCalled();
      expect(response).toStrictEqual({
        action: ChannelAction.ENABLE,
        deploymentType: ChannelConfigDeploymentType.DEFERRED,
        channel: channelName,
        response: mockAPIResponse,
      });
    });

    test('returns unsuccessful API response', async () => {
      const mockAPIResponse = getMockAnalyticsAPIResponse({ status: false });
      mockInvokeAnalyticsResourceToggleNotificationChannel.mockResolvedValue(mockAPIResponse);
      const response = await channel.enable(mockContext);
      expect(mockSpinner.fail).toBeCalled();
      expect(response).toStrictEqual({
        action: ChannelAction.ENABLE,
        deploymentType: ChannelConfigDeploymentType.DEFERRED,
        channel: channelName,
        response: mockAPIResponse,
      });
    });
  });

  describe('disable', () => {
    test('returns successful API response', async () => {
      const mockAPIResponse = getMockAnalyticsAPIResponse({ status: true });
      mockInvokeAnalyticsResourceToggleNotificationChannel.mockResolvedValue(mockAPIResponse);
      const response = await channel.disable(mockContext);
      expect(mockSpinner.succeed).toBeCalled();
      expect(response).toStrictEqual({
        action: ChannelAction.DISABLE,
        deploymentType: ChannelConfigDeploymentType.DEFERRED,
        channel: channelName,
        response: mockAPIResponse,
      });
    });

    test('returns unsuccessful API response', async () => {
      const mockAPIResponse = getMockAnalyticsAPIResponse({ status: false });
      mockInvokeAnalyticsResourceToggleNotificationChannel.mockResolvedValue(mockAPIResponse);
      const response = await channel.disable(mockContext);
      expect(mockSpinner.fail).toBeCalled();
      expect(response).toStrictEqual({
        action: ChannelAction.DISABLE,
        deploymentType: ChannelConfigDeploymentType.DEFERRED,
        channel: channelName,
        response: mockAPIResponse,
      });
    });
  });

  describe('pull', () => {
    test('succeeds when channel metadata is available', async () => {
      const mockChannelMeta = { foo: 'bar' };
      getAppMetaSpy.mockResolvedValue({
        output: { channels: { [channelName]: mockChannelMeta } },
      } as unknown as INotificationsResourceMeta);
      await channel.pull(mockContext, mockPinpointApp);
      expect(mockSpinner.succeed).toBeCalled();
      expect(mockPinpointApp[channelName]).toStrictEqual(mockChannelMeta);
      expect(mockBuildPinpointChannelResponseSuccess).toBeCalledWith(
        ChannelAction.PULL,
        ChannelConfigDeploymentType.DEFERRED,
        channelName,
        mockChannelMeta,
      );
    });

    test('succeeds when channel metadata is unavailable but backend config is', async () => {
      const expectedMeta = {
        Enabled: true,
        ApplicationId: mockPinpointApp.Id,
        Name: mockPinpointApp.Name,
      };
      getAppMetaSpy.mockResolvedValue({} as unknown as INotificationsResourceMeta);
      getAppConfigSpy.mockResolvedValue({ channels: [channelName] } as INotificationsResourceBackendConfig);
      await channel.pull(mockContext, mockPinpointApp);
      expect(mockSpinner.succeed).toBeCalled();
      expect(mockPinpointApp[channelName]).toStrictEqual(expectedMeta);
      expect(mockBuildPinpointChannelResponseSuccess).toBeCalledWith(
        ChannelAction.PULL,
        ChannelConfigDeploymentType.DEFERRED,
        channelName,
        expectedMeta,
      );
    });

    test('should not fail when channel metadata and backend config are both unavailable but return undefined', async () => {
      getAppMetaSpy.mockResolvedValue({} as unknown as INotificationsResourceMeta);
      getAppConfigSpy.mockResolvedValue({} as INotificationsResourceBackendConfig);
      await channel.pull(mockContext, mockPinpointApp);
      expect(mockBuildPinpointChannelResponseSuccess).not.toBeCalled();
    });
  });
});
