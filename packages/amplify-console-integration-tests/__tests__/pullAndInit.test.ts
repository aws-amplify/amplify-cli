import * as fs from 'fs-extra';
import {
  getConfiguredAmplifyClient,
  createConsoleApp,
  generateBackendEnvParams,
  createBackendEnvironment,
  deleteConsoleApp,
  deleteAmplifyStack,
} from '../src/pullAndInit/amplifyConsoleOperations';
import {
  createNewProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefaultSocial,
  amplifyPushAuth,
  deleteProject,
  deleteAmplifyDir,
  deleteProjectDir,
  getSocialProviders,
  getAmplifyDirPath,
  isDeploymentSecretForEnvExists,
} from '@aws-amplify/amplify-e2e-core';
import { headlessInit } from '../src/pullAndInit/initProject';
import { headlessPull, authConfigPull } from '../src/pullAndInit/pullProject';
import { headlessDelete } from '../src/pullAndInit/deleteProject';
import { getConfigFromProfile } from '../src/profile-helper';
import {
  removeFilesForTeam,
  removeFilesForThirdParty,
  checkAmplifyFolderStructure,
  getTeamProviderInfo,
  getProjectConfig,
  removeDotConfigDir,
} from '../src/pullAndInit/amplifyArtifactsManager';
import * as util from '../src/util';

describe('amplify console build', () => {
  it('connects to team project', async () => {
    const amplifyClient = getConfiguredAmplifyClient();
    const projectName = 'cliintegrationteam';

    const appId = await createConsoleApp(projectName, amplifyClient);
    let envName = 'enva';
    let backendParams = generateBackendEnvParams(appId, projectName, envName);

    await createBackendEnvironment(backendParams, amplifyClient);

    let amplifyParam = {
      envName,
      appId,
    };
    const providersParam = {
      awscloudformation: {
        configLevel: 'project',
        useProfile: true,
        profileName: util.getProfileName(),
      },
    };
    const codegenParam = {
      generateCode: false,
      generateDocs: false,
    };

    let teamProviderInfo;
    //test for init a clean frontend project
    const projectDirPath = await util.createNewProjectDir('console');
    await headlessInit(projectDirPath, amplifyParam, providersParam, codegenParam);
    expect(checkAmplifyFolderStructure(projectDirPath)).toBeTruthy();
    teamProviderInfo = getTeamProviderInfo(projectDirPath);
    expect(teamProviderInfo).toBeDefined();

    //test for existing env
    removeFilesForTeam(projectDirPath);
    await headlessPull(projectDirPath, amplifyParam, providersParam);
    await headlessInit(projectDirPath, amplifyParam, providersParam, codegenParam);
    expect(checkAmplifyFolderStructure(projectDirPath)).toBeTruthy();
    teamProviderInfo = getTeamProviderInfo(projectDirPath);
    expect(teamProviderInfo).toBeDefined();
    expect(teamProviderInfo['enva']).toBeDefined();

    //test for new env
    envName = 'envb';
    backendParams = generateBackendEnvParams(appId, projectName, envName);

    await createBackendEnvironment(backendParams, amplifyClient);

    amplifyParam = {
      envName,
      appId,
    };

    const projectDirPathForEnvB = await util.createNewProjectDir('console');
    await headlessInit(projectDirPathForEnvB, amplifyParam, providersParam, codegenParam);

    expect(checkAmplifyFolderStructure(projectDirPathForEnvB)).toBeTruthy();

    teamProviderInfo = getTeamProviderInfo(projectDirPathForEnvB);
    expect(teamProviderInfo).toBeDefined();
    expect(teamProviderInfo['envb']).toBeDefined();

    // clean up after the tests
    await headlessDelete(projectDirPath);
    await headlessDelete(projectDirPathForEnvB);

    await deleteConsoleApp(appId, amplifyClient);
    util.deleteProjectDir(projectDirPath);
  });

  it('connects to third party project', async () => {
    const amplifyClient = getConfiguredAmplifyClient();

    const projectName = 'cliintegrationthirdparty';
    let envName = 'devteama';
    const appIdA = await createConsoleApp(projectName, amplifyClient);
    let backendParams = generateBackendEnvParams(appIdA, projectName, envName);
    await createBackendEnvironment(backendParams, amplifyClient);

    let amplifyParam = {
      envName,
      appId: appIdA,
    };
    const providersParam = {
      awscloudformation: {
        configLevel: 'project',
        useProfile: true,
        profileName: util.getProfileName(),
      },
    };
    const codegenParam = {
      generateCode: false,
      generateDocs: false,
    };

    //create the original project
    const originalProjectDirPath = await util.createNewProjectDir('console-original');
    await headlessInit(originalProjectDirPath, amplifyParam, providersParam, codegenParam);
    expect(checkAmplifyFolderStructure(originalProjectDirPath)).toBeTruthy();
    const originalTeamProviderInfo = getTeamProviderInfo(originalProjectDirPath);
    expect(originalTeamProviderInfo).toBeDefined();
    expect(originalTeamProviderInfo['devteama']).toBeDefined();

    //test for third party setup
    const clonedProjectDirPath = await util.createNewProjectDir('console-cloned');
    fs.copySync(originalProjectDirPath, clonedProjectDirPath);
    removeFilesForThirdParty(clonedProjectDirPath);
    removeDotConfigDir(clonedProjectDirPath);
    envName = 'devteamb';
    const appIdB = await createConsoleApp(projectName, amplifyClient);
    backendParams = generateBackendEnvParams(appIdB, projectName, envName);
    await createBackendEnvironment(backendParams, amplifyClient);
    amplifyParam = {
      envName,
      appId: appIdB,
    };
    await headlessInit(clonedProjectDirPath, amplifyParam, providersParam, codegenParam);
    expect(checkAmplifyFolderStructure(clonedProjectDirPath)).toBeTruthy();
    const clonedTeamProviderInfo = getTeamProviderInfo(clonedProjectDirPath);
    expect(clonedTeamProviderInfo).toBeDefined();
    expect(clonedTeamProviderInfo['devteamb']).toBeDefined();

    //clean up after the tests
    await headlessDelete(originalProjectDirPath);
    await deleteConsoleApp(appIdA, amplifyClient);
    util.deleteProjectDir(originalProjectDirPath);
    await headlessDelete(clonedProjectDirPath);
    await deleteConsoleApp(appIdB, amplifyClient);
    util.deleteProjectDir(clonedProjectDirPath);
  });
});

describe('amplify app console tests', () => {
  let projRoot: string;
  let stackName: string;
  let AmplifyAppID: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('consoleApp');
  });
  afterEach(async () => {
    if (!fs.existsSync(getAmplifyDirPath(projRoot)) && stackName && AmplifyAppID) {
      await deleteAmplifyStack(stackName);
      await deleteConsoleApp(AmplifyAppID);
    } else {
      await deleteProject(projRoot, getConfigFromProfile());
    }
    deleteProjectDir(projRoot);
  });
  it('test headless pull with authConfig', async () => {
    const envName = 'dev';
    const providersParam = {
      awscloudformation: {
        configLevel: 'project',
        useProfile: true,
        profileName: util.getProfileName(),
      },
    };
    const {
      FACEBOOK_APP_ID,
      FACEBOOK_APP_SECRET,
      GOOGLE_APP_ID,
      GOOGLE_APP_SECRET,
      AMAZON_APP_ID,
      AMAZON_APP_SECRET,
      APPLE_APP_ID,
      APPLE_TEAM_ID,
      APPLE_KEY_ID,
      APPLE_PRIVATE_KEY,
    } = getSocialProviders();
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false, name: 'authConsoleTest', envName });
    await addAuthWithDefaultSocial(projRoot);
    expect(isDeploymentSecretForEnvExists(projRoot, envName)).toBeTruthy();
    await amplifyPushAuth(projRoot);
    expect(isDeploymentSecretForEnvExists(projRoot, envName)).toBeFalsy();
    let teamInfo = getTeamProviderInfo(projRoot);
    expect(teamInfo).toBeDefined();
    let appId = teamInfo[envName].awscloudformation.AmplifyAppId;
    AmplifyAppID = appId;
    stackName = teamInfo[envName].awscloudformation.StackName;
    expect(stackName).toBeDefined();
    expect(appId).toBeDefined();
    expect(teamInfo[envName].categories.auth).toBeDefined();
    let authTeamInfo = Object.keys(teamInfo[envName].categories.auth).map((key) => teamInfo[envName].categories.auth[key])[0];
    expect(authTeamInfo).not.toHaveProperty('hostedUIProviderCreds');

    deleteAmplifyDir(projRoot);

    await headlessPull(projRoot, { envName, appId }, providersParam, {
      auth: {
        facebookAppIdUserPool: FACEBOOK_APP_ID,
        facebookAppSecretUserPool: FACEBOOK_APP_SECRET,
        googleAppIdUserPool: GOOGLE_APP_ID,
        googleAppSecretUserPool: GOOGLE_APP_SECRET,
        loginwithamazonAppIdUserPool: AMAZON_APP_ID,
        loginwithamazonAppSecretUserPool: AMAZON_APP_SECRET,
        signinwithappleClientIdUserPool: APPLE_APP_ID,
        signinwithappleTeamIdUserPool: APPLE_TEAM_ID,
        signinwithappleKeyIdUserPool: APPLE_KEY_ID,
        signinwithapplePrivateKeyUserPool: APPLE_PRIVATE_KEY,
      },
    });

    teamInfo = getTeamProviderInfo(projRoot);
    expect(teamInfo).toBeDefined();
    appId = teamInfo[envName].awscloudformation.AmplifyAppId;
    expect(appId).toBeDefined();
    expect(teamInfo[envName].categories.auth).toBeDefined();
    authTeamInfo = Object.keys(teamInfo[envName].categories.auth).map((key) => teamInfo[envName].categories.auth[key])[0];
    expect(authTeamInfo).not.toHaveProperty('hostedUIProviderCreds');

    // with frontend
    deleteAmplifyDir(projRoot);
    await headlessPull(
      projRoot,
      { envName, appId },
      providersParam,
      {
        auth: {
          facebookAppIdUserPool: FACEBOOK_APP_ID,
          facebookAppSecretUserPool: FACEBOOK_APP_SECRET,
          googleAppIdUserPool: GOOGLE_APP_ID,
          googleAppSecretUserPool: GOOGLE_APP_SECRET,
          loginwithamazonAppIdUserPool: AMAZON_APP_ID,
          loginwithamazonAppSecretUserPool: AMAZON_APP_SECRET,
          signinwithappleClientIdUserPool: APPLE_APP_ID,
          signinwithappleTeamIdUserPool: APPLE_TEAM_ID,
          signinwithappleKeyIdUserPool: APPLE_KEY_ID,
          signinwithapplePrivateKeyUserPool: APPLE_PRIVATE_KEY,
        },
      },
      {
        frontend: 'javascript',
        config: {
          BuildCommand: 'yarn run build',
          DistributionDir: 'build',
          SourceDir: 'src',
          StartCommand: 'yarn run start',
        },
        framework: 'react-native',
      },
    );

    const projectConfig = getProjectConfig(projRoot);
    expect(projectConfig).toEqual({
      providers: ['awscloudformation'],
      projectName: 'authConsoleTest',
      version: '3.1',
      frontend: 'javascript',
      javascript: {
        framework: 'react-native',
        config: {
          SourceDir: 'src',
          DistributionDir: 'build',
          BuildCommand: 'yarn run build',
          StartCommand: 'yarn run start',
        },
      },
    });
  });

  it('test pull with auth config', async () => {
    const envName = 'dev';
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false, name: 'authConsoleTest', envName });
    await addAuthWithDefaultSocial(projRoot);
    await amplifyPushAuth(projRoot);
    let teamInfo = getTeamProviderInfo(projRoot);
    expect(teamInfo).toBeDefined();
    let appId = teamInfo[envName].awscloudformation.AmplifyAppId;
    AmplifyAppID = appId;
    stackName = teamInfo[envName].awscloudformation.StackName;
    expect(stackName).toBeDefined();
    expect(appId).toBeDefined();
    expect(teamInfo[envName].categories.auth).toBeDefined();
    let authTeamInfo = Object.keys(teamInfo[envName].categories.auth).map((key) => teamInfo[envName].categories.auth[key])[0];
    expect(authTeamInfo).not.toHaveProperty('hostedUIProviderCreds');

    deleteAmplifyDir(projRoot);

    await authConfigPull(projRoot, { appId, envName });

    teamInfo = getTeamProviderInfo(projRoot);
    expect(teamInfo).toBeDefined();
    appId = teamInfo[envName].awscloudformation.AmplifyAppId;
    expect(appId).toBeDefined();
    expect(teamInfo[envName].categories.auth).toBeDefined();
    authTeamInfo = Object.keys(teamInfo[envName].categories.auth).map((key) => teamInfo[envName].categories.auth[key])[0];
    expect(authTeamInfo).not.toHaveProperty('hostedUIProviderCreds');
  });
});
