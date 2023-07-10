import {
  addNotificationChannel,
  amplifyPullNonInteractive,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProjectDir,
  getAmplifyFlutterConfig,
  getAppId,
  getAWSExports,
  removeAllNotificationChannel,
} from '@aws-amplify/amplify-e2e-core';
import { $TSAny, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getShortId } from '../../import-helpers';

const pinpointSettings = { resourceName: `notifications${getShortId()}` };

export const runPinpointConfigTest = async (
  projectRoot: string,
  envName: string,
  frontendConfig: { frontend: string; config?: { ResDir?: string } },
  validate: (projectRoot: string, channels: string[]) => void,
): Promise<void> => {
  const appId = getAppId(projectRoot);
  expect(appId).toBeDefined();

  await addNotificationChannel(projectRoot, pinpointSettings, 'In-App Messaging');
  await amplifyPushAuth(projectRoot);
  validate(projectRoot, ['In-App Messaging']);

  const secondRoot = await createNewProjectDir('notifications-pinpoint-pull');
  try {
    await amplifyPullNonInteractive(secondRoot, {
      appId,
      frontend: frontendConfig,
      envName,
    });
    validate(secondRoot, ['In-App Messaging']);
  } finally {
    deleteProjectDir(secondRoot);
  }

  await addNotificationChannel(projectRoot, pinpointSettings, 'SMS', true, true);
  validate(projectRoot, ['In-App Messaging', 'SMS']);

  await removeAllNotificationChannel(projectRoot);
  validate(projectRoot, []);
};

export const iosValidate = (projectRoot: string, channels: string[]): void => {
  const configPath = path.join(projectRoot, 'amplifyconfiguration.json');
  iosAndroidValidate(configPath, channels);
};

export const androidValidate = (projectRoot: string, channels: string[]): void => {
  const configPath = path.join(projectRoot, 'app', 'src', 'main', 'res', 'raw', 'amplifyconfiguration.json');
  iosAndroidValidate(configPath, channels);
};

export const flutterValidate = (projectRoot: string, channels: string[]): void => {
  const config = getAmplifyFlutterConfig(projectRoot);
  validateNativeJsonConfig(channels, config);
};

export const javascriptValidate = (projectRoot: string, channels: string[]): void => {
  const config = getAWSExports(projectRoot);
  const channelPlugins = {
    PUSH: 'Push',
    Email: 'Email',
    SMS: 'SMS',
    'In-App Messaging': 'InAppMessaging',
  };

  for (const key in channelPlugins) {
    const plugin = channelPlugins[key];

    if (channels.includes(key)) {
      expect(config?.Notifications?.[plugin]?.AWSPinpoint?.appId).toBeDefined();
      expect(config?.Notifications?.[plugin]?.AWSPinpoint?.region).toBeDefined();
    } else {
      expect(config?.Notifications?.[plugin]).not.toBeDefined();
      expect(config?.Notifications?.[plugin]).not.toBeDefined();
    }
  }
};

const iosAndroidValidate = (configPath: string, channels: string[]): void => {
  expect(fs.existsSync(configPath)).toBe(true);
  const config = JSONUtilities.readJson<$TSAny>(configPath);
  validateNativeJsonConfig(channels, config);
};

const validateNativeJsonConfig = (channels: string[], config: any): void => {
  const channelPlugins = {
    PUSH: 'awsPinpointPushNotificationsPlugin',
    Email: 'awsPinpointEmailNotificationsPlugin',
    SMS: 'awsPinpointSmsNotificationsPlugin',
    'In-App Messaging': 'awsPinpointInAppMessagingNotificationsPlugin',
  };

  for (const key in channelPlugins) {
    const plugin = channelPlugins[key];

    if (channels.includes(key)) {
      expect(config?.notifications?.plugins?.[plugin]?.appId).toBeDefined();
      expect(config?.notifications?.plugins?.[plugin]?.region).toBeDefined();
    } else {
      expect(config?.notifications?.plugins?.[plugin]).not.toBeDefined();
      expect(config?.notifications?.plugins?.[plugin]).not.toBeDefined();
    }
  }
};
