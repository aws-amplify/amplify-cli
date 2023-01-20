import {
  addNotificationChannel,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAmplifyFlutterConfig,
  getAppId,
  initAndroidProjectWithProfile,
  initFlutterProjectWithProfile,
  initIosProjectWithProfile,
  initJSProjectWithProfile,
  removeAllNotificationChannel,
} from '@aws-amplify/amplify-e2e-core';
import { getShortId } from '../../import-helpers';
import * as path from 'path';
import * as fs from 'fs-extra';
import { $TSAny, JSONUtilities } from 'amplify-cli-core';
import { getAWSExports } from '../../schema-api-directives/authHelper';

const envName = 'integtest';
const projectSettings = { envName };
const pinpointSettings = { resourceName: `notifications${getShortId()}` };

describe('notifications pinpoint configuration', () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('notifications-pinpoint');
  });

  afterEach(async () => {
    deleteProjectDir(projectRoot);
  });

  it('should add pinpoint to iOS configuration', async () => {
    await initIosProjectWithProfile(projectRoot, projectSettings);
    try {
      await runPinpointConfigTest(projectRoot, iosValidate);
    } finally {
      await deleteProject(projectRoot);
    }
  });

  it('should add pinpoint to Android configuration', async () => {
    await initAndroidProjectWithProfile(projectRoot, projectSettings);
    try {
      await runPinpointConfigTest(projectRoot, androidValidate);
    } finally {
      await deleteProject(projectRoot);
    }
  });

  it('should add pinpoint to JS configuration', async () => {
    await initJSProjectWithProfile(projectRoot, projectSettings);
    try {
      await runPinpointConfigTest(projectRoot, javascriptValidate);
    } finally {
      await deleteProject(projectRoot);
    }
  });

  it('should add pinpoint to Flutter configuration', async () => {
    await initFlutterProjectWithProfile(projectRoot, projectSettings);
    try {
      await runPinpointConfigTest(projectRoot, flutterValidate);
    } finally {
      await deleteProject(projectRoot);
    }
  });
});

const runPinpointConfigTest = async (projectRoot: string, validate: (projectRoot: string, channels: string[]) => void): Promise<void> => {
  const appId = getAppId(projectRoot);
  expect(appId).toBeDefined();

  await addNotificationChannel(projectRoot, pinpointSettings, 'In-App Messaging');
  await amplifyPushAuth(projectRoot);
  validate(projectRoot, ['In-App Messaging']);

  const secondRoot = await createNewProjectDir('notifications-pinpoint-pull');
  try {
    await amplifyPull(secondRoot, { emptyDir: true, appId, envName, yesFlag: true });
    validate(secondRoot, ['In-App Messaging']);
  } finally {
    deleteProjectDir(secondRoot);
  }

  await addNotificationChannel(projectRoot, pinpointSettings, 'SMS');
  await amplifyPushAuth(projectRoot);
  validate(projectRoot, ['In-App Messaging', 'SMS']);

  await removeAllNotificationChannel(projectRoot);
  await amplifyPushAuth(projectRoot);
  validate(projectRoot, []);
};

const iosValidate = (projectRoot: string, channels: string[]): void => {
  const configPath = path.join(projectRoot, 'amplifyconfiguration.json');
  iosAndroidValidate(configPath, channels);
};

const androidValidate = (projectRoot: string, channels: string[]): void => {
  const configPath = path.join(projectRoot, 'app', 'src', 'main', 'res', 'raw', 'amplifyconfiguration.json');
  iosAndroidValidate(configPath, channels);
};

const iosAndroidValidate = (configPath: string, channels: string[]): void => {
  expect(fs.existsSync(configPath)).toBe(true);
  const config = JSONUtilities.readJson<$TSAny>(configPath);
  validateNativeJsonConfig(channels, config);
};

const flutterValidate = (projectRoot: string, channels: string[]): void => {
  const config = getAmplifyFlutterConfig(projectRoot);
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

const javascriptValidate = (projectRoot: string, channels: string[]): void => {
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
