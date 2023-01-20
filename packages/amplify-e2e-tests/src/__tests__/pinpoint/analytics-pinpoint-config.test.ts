import * as path from 'path';
import * as fs from 'fs-extra';
import {
  addPinpointAnalytics,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  initAndroidProjectWithProfile,
  initFlutterProjectWithProfile,
  initIosProjectWithProfile,
  initJSProjectWithProfile,
  removeAnalytics,
} from '@aws-amplify/amplify-e2e-core';
import { JSONUtilities } from 'amplify-cli-core';

const envName = 'integtest';
const projectSettings = { envName };

describe('analytics pinpoint configuration', () => {
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

const runPinpointConfigTest = async (
  projectRoot: string,
  validate: (projectRoot: string, hasAnalytics: boolean) => void,
): Promise<void> => {
  const appId = getAppId(projectRoot);
  expect(appId).toBeDefined();

  await addPinpointAnalytics(projectRoot);
  await amplifyPushAuth(projectRoot);
  validate(projectRoot, true);

  const secondRoot = await createNewProjectDir('notifications-pinpoint-pull');
  try {
    await amplifyPull(secondRoot, { emptyDir: true, appId, envName, yesFlag: true });
    validate(secondRoot, true);
  } finally {
    deleteProjectDir(secondRoot);
  }

  await removeAnalytics(projRoot, {});
  await amplifyPushAuth(projectRoot);
  validate(projectRoot, false);
};

const iosValidate = (projectRoot: string, hasAnalytics: boolean): void => {
  const configPath = path.join(projectRoot, 'amplifyconfiguration.json');
  iosAndroidValidate(configPath, hasAnalytics);
};

const androidValidate = (projectRoot: string, hasAnalytics: boolean): void => {
  const configPath = path.join(projectRoot, 'app', 'src', 'main', 'res', 'raw', 'amplifyconfiguration.json');
  iosAndroidValidate(configPath, hasAnalytics);
};

const iosAndroidValidate = (configPath: string, hasAnalytics: boolean): void => {
  expect(fs.existsSync(configPath)).toBe(true);
  const config = JSONUtilities.readJson<$TSAny>(configPath);
  validateNativeJsonConfig(config, hasAnalytics);
};

const flutterValidate = (projectRoot: string, hasAnalytics: boolean): void => {
  const config = getAmplifyFlutterConfig(projectRoot);
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

const javascriptValidate = (projectRoot: string, hasAnalytics: boolean): void => {
  const config = getAWSExports(projectRoot);
  if (hasAnalytics) {
    expect(config?.Analytics?.AWSPinpoint?.appId).toBeDefined();
    expect(config?.Analytics?.AWSPinpoint?.region).toBeDefined();
  } else {
    expect(config?.Analytics).not.toBeDefined();
    expect(config?.Analytics).not.toBeDefined();
  }
};
