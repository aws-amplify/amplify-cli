import { initJSProjectWithProfile, deleteProject } from '../init';
import {
  addManualHosting,
  npmInstall,
  amplifyPublish,
  amplifyPush,
  removeHosting,
  addCICDHostingWithoutFrontend,
  amplifyStatus,
  checkoutEnv
} from '../categories/consoleHosting/consoleHosting';
import { loadTypeFromTeamProviderInfo } from '../categories/consoleHosting/utils';
import { deleteProjectDir, createAuthProject } from '../utils';
import { addEnvironment } from '../environment/add-env';
import * as fs from 'fs-extra';
import * as path from 'path';
import { TYPE_MANUAL, TYPE_CICD } from '../categories/consoleHosting/constants';
import { ORIGINAL_ENV, NWE_ENV } from '../categories/consoleHosting/constants';

describe('amplify console add hosting', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = createAuthProject();
    await initJSProjectWithProfile(projRoot, {});
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  // Manual tests
  it('add / publish / configure/ serve /remove hosting for manual deployment should succeed', async () => {
    try {
      await addManualHosting(projRoot);
      expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'amplifyhosting'))).toBe(true);
      const type = loadTypeFromTeamProviderInfo(projRoot, ORIGINAL_ENV);
      expect(type).toBe(TYPE_MANUAL);
      await npmInstall(projRoot);
      await amplifyPublish(projRoot);
      await removeHosting(projRoot);
      await amplifyPush(projRoot);
    } catch (err) {
      throw err;
    }
  });

  it('when hosting is enabled, add new env should be able to deploy frontend successfully', async () => {
    await addManualHosting(projRoot);
    await addEnvironment(projRoot, { envName: NWE_ENV});
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'amplifyhosting'))).toBe(true);
    const type = loadTypeFromTeamProviderInfo(projRoot, NWE_ENV);
    expect(type).toBe(TYPE_MANUAL);
    await npmInstall(projRoot);
    await amplifyPublish(projRoot);

    await removeHosting(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'amplifyhosting'))).toBe(false);
    await amplifyPush(projRoot);
  });

   it('amplify status should show correct operations when create/ checkout env/ remove', async () => {
    await addManualHosting(projRoot);
    await amplifyStatus(projRoot, 'Create', true);
    await amplifyPush(projRoot);
    await amplifyStatus(projRoot, 'No Change', true);
    await addEnvironment(projRoot, { envName: NWE_ENV});
    await amplifyStatus(projRoot, 'Create', true);
    await removeHosting(projRoot);
    await checkoutEnv(projRoot, ORIGINAL_ENV);
    await amplifyStatus(projRoot, 'Delete', true);
   });

  // CICD tests
  it('when user does not add frontend in amplify console, no config file will be written in CLI', async () => {
    await addCICDHostingWithoutFrontend(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'amplifyhosting'))).toBe(false);
  });
});
