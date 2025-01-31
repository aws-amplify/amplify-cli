import * as path from 'path';
import * as fs from 'fs-extra';
import {
  addPinpointAnalytics,
  amplifyPullNonInteractive,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProjectDir,
  getAmplifyFlutterConfig,
  getAppId,
  getAWSExports,
  removeAnalytics,
} from '@aws-amplify/amplify-e2e-core';
import { JSONUtilities, $TSAny } from '@aws-amplify/amplify-cli-core';

export const runPinpointConfigTest = async (
  projectRoot: string,
  envName: string,
  frontendConfig: { frontend: string; config?: { ResDir?: string } },
  validate: (projectRoot: string, hasAnalytics: boolean) => void,
): Promise<void> => {
  const appId = getAppId(projectRoot);
  expect(appId).toBeDefined();

  await addPinpointAnalytics(projectRoot);
  await amplifyPushAuth(projectRoot);
  validate(projectRoot, true);

  const secondRoot = await createNewProjectDir('notifications-pinpoint-pull');
  try {
    await amplifyPullNonInteractive(secondRoot, {
      appId,
      frontend: frontendConfig,
      envName,
    });
    validate(secondRoot, true);
  } finally {
    deleteProjectDir(secondRoot);
  }

  await removeAnalytics(projectRoot);
  await amplifyPushAuth(projectRoot);
  validate(projectRoot, false);
};

export const iosValidate = (projectRoot: string, hasAnalytics: boolean): void => {
  const configPath = path.join(projectRoot, 'amplifyconfiguration.json');
  iosAndroidValidate(configPath, hasAnalytics);
};

export const androidValidate = (projectRoot: string, hasAnalytics: boolean): void => {
  const configPath = path.join(projectRoot, 'app', 'src', 'main', 'res', 'raw', 'amplifyconfiguration.json');
  iosAndroidValidate(configPath, hasAnalytics);
};

export const flutterValidate = (projectRoot: string, hasAnalytics: boolean): void => {
  const config = getAmplifyFlutterConfig(projectRoot);
  validateNativeJsonConfig(config, hasAnalytics);
};

export const javascriptValidate = (projectRoot: string, hasAnalytics: boolean): void => {
  const config = getAWSExports(projectRoot);
  if (hasAnalytics) {
    expect(config?.Analytics?.AWSPinpoint?.appId).toBeDefined();
    expect(config?.Analytics?.AWSPinpoint?.region).toBeDefined();
  } else {
    expect(config?.Analytics).not.toBeDefined();
    expect(config?.Analytics).not.toBeDefined();
  }
};

const iosAndroidValidate = (configPath: string, hasAnalytics: boolean): void => {
  expect(fs.existsSync(configPath)).toBe(true);
  const config = JSONUtilities.readJson<$TSAny>(configPath);
  validateNativeJsonConfig(config, hasAnalytics);
};

const validateNativeJsonConfig = (config: any, hasAnalytics: boolean): void => {
  if (hasAnalytics) {
    expect(config?.analytics?.plugins?.awsPinpointAnalyticsPlugin?.pinpointAnalytics?.appId).toBeDefined();
    expect(config?.analytics?.plugins?.awsPinpointAnalyticsPlugin?.pinpointAnalytics?.region).toBeDefined();
  } else {
    expect(config?.analytics?.plugins?.awsPinpointAnalyticsPlugin).not.toBeDefined();
    expect(config?.analytics?.plugins?.awsPinpointAnalyticsPlugin).not.toBeDefined();
  }
};
