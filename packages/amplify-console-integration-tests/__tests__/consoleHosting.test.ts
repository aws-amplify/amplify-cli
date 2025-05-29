import {
  addManualHosting,
  amplifyPublish,
  amplifyPush,
  removeHosting,
  removeNonExistingHosting,
  removeHostingEnabledInConsole,
  addCICDHostingWithoutFrontend,
  amplifyStatus,
  checkoutEnv,
  deleteProject,
  addEnvironment,
} from '../src/consoleHosting/consoleHosting';
import { loadTypeFromTeamProviderInfo, createTestProject, cleanHostingLocally } from '../src/consoleHosting/utils';
import { deleteProjectDir, getProfileName, npmInstall } from '../src/util';
import * as fs from 'fs-extra';
import * as path from 'path';
import { TYPE_MANUAL } from '../src/consoleHosting/constants';
import { ORIGINAL_ENV, NEW_ENV } from '../src/consoleHosting/constants';
import { initJSProjectWithProfile } from '@aws-amplify/amplify-e2e-core';

describe('amplify console add hosting', () => {
  let projRoot: string;

  const providersParam = {
    awscloudformation: {
      configLevel: 'project',
      useProfile: true,
      profileName: getProfileName(),
    },
  };

  beforeEach(async () => {
    process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT === 'true';
    projRoot = await createTestProject();
    await initJSProjectWithProfile(projRoot, { providerConfig: providersParam, disableAmplifyAppCreation: false });
  });

  afterEach(async () => {
    process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT === 'false';
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  // Manual tests
  it('add / publish / configure/ serve /remove hosting for manual deployment should succeed', async () => {
    await addManualHosting(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'amplifyhosting'))).toBe(true);
    const type = loadTypeFromTeamProviderInfo(projRoot, ORIGINAL_ENV);
    expect(type).toBe(TYPE_MANUAL);
    npmInstall(projRoot);
    await amplifyPublish(projRoot);
    await removeHosting(projRoot);
    await amplifyPush(projRoot);
  });

  it('when hosting is enabled, add new env should be able to deploy frontend successfully', async () => {
    await addManualHosting(projRoot);
    await addEnvironment(projRoot, { providersParam, envName: NEW_ENV });
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'amplifyhosting'))).toBe(true);
    const type = loadTypeFromTeamProviderInfo(projRoot, NEW_ENV);
    expect(type).toBe(TYPE_MANUAL);
    npmInstall(projRoot);
    await amplifyPublish(projRoot);

    await removeHosting(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'amplifyhosting'))).toBe(false);
    await amplifyPush(projRoot);
  });

  it('amplify status should show correct operations when create/ checkout env/ remove', async () => {
    await addManualHosting(projRoot);
    await amplifyStatus(projRoot, 'Create');
    await amplifyPush(projRoot);
    await amplifyStatus(projRoot, 'No Change');
    await addEnvironment(projRoot, { providersParam, envName: NEW_ENV });
    await amplifyStatus(projRoot, 'Create');
    await removeHosting(projRoot);
    await checkoutEnv(projRoot, ORIGINAL_ENV);
    await amplifyStatus(projRoot, 'Delete');
  });

  it('amplify remove hosting should print out correct error message when there is no local hosting', async () => {
    await removeNonExistingHosting(projRoot);
    await addManualHosting(projRoot);
    await amplifyPush(projRoot);
    cleanHostingLocally(projRoot, ORIGINAL_ENV);
    await removeHostingEnabledInConsole(projRoot);
  });

  // CICD tests
  it('when user does not add frontend in amplify console, no config file will be written in CLI', async () => {
    await addCICDHostingWithoutFrontend(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'amplifyhosting'))).toBe(false);
  });
});
