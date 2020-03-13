import { initJSProjectWithProfile, deleteProject } from '../src/init';
import {
  addManualHosting,
  npmInstall,
  amplifyPublish,
  amplifyPush,
  removeHosting,
  addCICDHostingWithoutFrontend,
  amplifyStatus,
  checkoutEnv,
} from '../src/consoleHosting/consoleHosting';
import { loadTypeFromTeamProviderInfo } from '../src/consoleHosting/utils';
import { deleteProjectDir, createAuthProject } from '../src/utils';
import { addEnvironment } from '../src/environment/add-env';
import * as fs from 'fs-extra';
import * as path from 'path';
import { TYPE_MANUAL, TYPE_CICD } from '../src/consoleHosting/constants';
import { ORIGINAL_ENV, NWE_ENV } from '../src/consoleHosting/constants';

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
    await addEnvironment(projRoot, { envName: NWE_ENV });
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'amplifyhosting'))).toBe(true);
    const type = loadTypeFromTeamProviderInfo(projRoot, NWE_ENV);
    expect(type).toBe(TYPE_MANUAL);
    await npmInstall(projRoot);
    await amplifyPublish(projRoot);

    await removeHosting(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'amplifyhosting'))).toBe(false);
    await amplifyPush(projRoot);
  });

  // CICD tests
  it('when user does not add frontend in amplify console, no config file will be written in CLI', async () => {
    await addCICDHostingWithoutFrontend(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'amplifyhosting'))).toBe(false);
  });
});
