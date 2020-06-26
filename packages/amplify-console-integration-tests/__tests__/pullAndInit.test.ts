import * as fs from 'fs-extra';
import {
  getConfiguredAmplifyClient,
  createConsoleApp,
  generateBackendEnvParams,
  createBackendEnvironment,
  deleteConsoleApp,
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
} from 'amplify-e2e-core';
import { headlessInit } from '../src/pullAndInit/initProject';
import { headlessPull } from '../src/pullAndInit/pullProject';
import { headlessDelete } from '../src/pullAndInit/deleteProject';
import {
  removeFilesForTeam,
  removeFilesForThirdParty,
  checkAmplifyFolderStructure,
  getTeamProviderInfo,
} from '../src/pullAndInit/amplifyArtifactsManager';
import * as util from '../src/util';

describe('amplify console build', () => {
  beforeAll(() => {});

  afterAll(() => {});

  beforeEach(() => {});

  afterEach(async () => {});

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

    removeFilesForTeam(projectDirPath);
    amplifyParam = {
      envName,
      appId,
    };
    await headlessInit(projectDirPath, amplifyParam, providersParam, codegenParam);
    expect(checkAmplifyFolderStructure(projectDirPath)).toBeTruthy();
    teamProviderInfo = getTeamProviderInfo(projectDirPath);
    expect(teamProviderInfo).toBeDefined();
    expect(teamProviderInfo['envb']).toBeDefined();

    // clean up after the tests
    await headlessDelete(projectDirPath);
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
    let originalTeamProviderInfo = getTeamProviderInfo(originalProjectDirPath);
    expect(originalTeamProviderInfo).toBeDefined();
    expect(originalTeamProviderInfo['devteama']).toBeDefined();

    //test for third party setup
    const clonedProjectDirPath = await util.createNewProjectDir('console-cloned');
    fs.copySync(originalProjectDirPath, clonedProjectDirPath);
    removeFilesForThirdParty(clonedProjectDirPath);
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
    let clonedTeamProviderInfo = getTeamProviderInfo(clonedProjectDirPath);
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
    } = getSocialProviders();
    const projRoot = await createNewProjectDir('consoleauth');
    await initJSProjectWithProfile(projRoot, { name: 'authConsoleTest', envName });
    await addAuthWithDefaultSocial(projRoot, {});
    await amplifyPushAuth(projRoot);
    let teamInfo = getTeamProviderInfo(projRoot);
    expect(teamInfo).toBeDefined();
    let appId = teamInfo[envName].awscloudformation.AmplifyAppId;
    expect(appId).toBeDefined();
    expect(teamInfo.categories.auth).toBeDefined();
    let authTeamInfo = Object.keys(teamInfo.categories.auth).map(key => teamInfo.categories.auth[key])[0];
    expect(authTeamInfo).toHaveProperty('hostedUIProviderCreds');

    deleteAmplifyDir(projRoot);

    await headlessPull(projRoot, { envName, appId }, providersParam, {
      facebookAppIdUserPool: FACEBOOK_APP_ID,
      facebookAppSecretUserPool: FACEBOOK_APP_SECRET,
      googleAppIdUserPool: GOOGLE_APP_ID,
      googleAppSecretUserPool: GOOGLE_APP_SECRET,
      amazonAppIdUserPool: AMAZON_APP_ID,
      amazonAppSecretUserPool: AMAZON_APP_SECRET,
    });

    teamInfo = getTeamProviderInfo(projRoot);
    expect(teamInfo).toBeDefined();
    appId = teamInfo[envName].awscloudformation.AmplifyAppId;
    expect(appId).toBeDefined();
    expect(teamInfo.categories.auth).toBeDefined();
    authTeamInfo = Object.keys(teamInfo.categories.auth).map(key => teamInfo.categories.auth[key])[0];
    expect(authTeamInfo).toHaveProperty('hostedUIProviderCreds');

    // delete project
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });
});
