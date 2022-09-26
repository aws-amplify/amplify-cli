import {
  $TSContext,
  AmplifyCategories,
  AmplifySupportedService,
  INotificationsResourceMeta,
  IPluginCapabilityAPIResponse,
  NotificationChannels,
} from 'amplify-cli-core';
import inquirer from 'inquirer';
import ora from 'ora';

import * as channel from '../src/channel-InAppMessaging';
import { ChannelAction, ChannelConfigDeploymentType } from '../src/channel-types';
import { Notifications } from '../src/notifications-api';
import { INotificationsResourceBackendConfig } from '../src/notifications-backend-cfg-types';
import {
  buildPinpointChannelResponseError,
  buildPinpointChannelResponseSuccess,
  getPinpointAppStatusFromMeta,
} from '../src/pinpoint-helper';
import { invokeAnalyticsResourceToggleNotificationChannel } from '../src/plugin-client-api-analytics';

jest.mock('amplify-cli-core', () => ({
  ...jest.requireActual('amplify-cli-core'),
  stateManager: {
    getCurrentBackendConfig: jest.fn(),
    getCurrentEnvName: jest.fn(),
    getCurrentMeta: jest.fn(),
  },
}));
jest.mock('inquirer');
jest.mock('ora', () => {
  const mockSpinnerInstance = {
    fail: jest.fn(),
    start: jest.fn(),
    succeed: jest.fn(),
  };
  return jest.fn(() => mockSpinnerInstance);
});
jest.mock('../src/notifications-api');
jest.mock('../src/pinpoint-helper');
jest.mock('../src/plugin-client-api-analytics');

const channelName = 'InAppMessaging';

const getAppConfigSpy = jest.spyOn(Notifications.Cfg, 'getNotificationsAppConfig');
const getAppMetaSpy = jest.spyOn(Notifications.Meta, 'getNotificationsAppMeta');
const isChannelEnabledSpy = jest.spyOn(Notifications.ChannelCfg, 'isChannelEnabledNotificationsBackendConfig');
const promptSpy = jest.spyOn(inquirer, 'prompt');

const mockContext = {
  print: { info: jest.fn(), error: jest.fn() },
  exeInfo: { amplifyMeta: {} },
} as unknown as $TSContext;
const mockBuildPinpointChannelResponseSuccess = buildPinpointChannelResponseSuccess as jest.Mock;
const mockBuildPinpointChannelResponseError = buildPinpointChannelResponseError as jest.Mock;
const mockGetPinpointAppStatusFromMeta = getPinpointAppStatusFromMeta as jest.Mock;
const mockInvokeAnalyticsResourceToggleNotificationChannel = invokeAnalyticsResourceToggleNotificationChannel as jest.Mock;
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
      mockInvokeAnalyticsResourceToggleNotificationChannel.mockResolvedValue(
        getMockAnalyticsAPIResponse({ status: true }),
      );
    });

    describe('enabled channel', () => {
      beforeEach(() => {
        isChannelEnabledSpy.mockResolvedValue(true);
      });

      test('user choosing to disable the channel', async () => {
        promptSpy.mockResolvedValue({ disableChannel: true });
        await channel.configure(mockContext);
        expect(promptSpy).toBeCalledWith(expect.objectContaining({ name: 'disableChannel' }));
        expect(mockSpinner.succeed).toBeCalled();
      });

      test('user choosing not to disable the channel', async () => {
        promptSpy.mockResolvedValue({ disableChannel: false });
        await channel.configure(mockContext);
        expect(promptSpy).toBeCalledWith(expect.objectContaining({ name: 'disableChannel' }));
        expect(mockSpinner.start).not.toBeCalled();
      });
    });

    describe('disabled channel', () => {
      beforeEach(() => {
        isChannelEnabledSpy.mockResolvedValue(false);
      });

      test('user choosing to enable the channel', async () => {
        mockGetPinpointAppStatusFromMeta.mockResolvedValue({});
        promptSpy.mockResolvedValue({ enableChannel: true });
        await channel.configure(mockContext);
        expect(promptSpy).toBeCalledWith(expect.objectContaining({ name: 'enableChannel' }));
        expect(mockSpinner.succeed).toBeCalled();
      });

      test('user choosing not to enable the channel', async () => {
        promptSpy.mockResolvedValue({ enableChannel: false });
        await channel.configure(mockContext);
        expect(promptSpy).toBeCalledWith(expect.objectContaining({ name: 'enableChannel' }));
        expect(mockSpinner.start).not.toBeCalled();
      });
    });
  });

  describe('enable', () => {
    beforeEach(() => {
      mockGetPinpointAppStatusFromMeta.mockResolvedValue({});
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

    test('fails when channel metadata and backend config are both unavailable', async () => {
      getAppMetaSpy.mockResolvedValue({} as unknown as INotificationsResourceMeta);
      getAppConfigSpy.mockResolvedValue({} as INotificationsResourceBackendConfig);
      await channel.pull(mockContext, mockPinpointApp);
      expect(mockSpinner.fail).toBeCalled();
      expect(mockBuildPinpointChannelResponseError).toBeCalledWith(
        ChannelAction.PULL,
        ChannelConfigDeploymentType.DEFERRED,
        channelName,
        expect.stringContaining(channelName),
      );
    });
  });
});
