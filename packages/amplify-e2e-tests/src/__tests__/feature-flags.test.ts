import * as fs from 'fs-extra';
import { initJSProjectWithProfile, deleteProject, addApiWithoutSchema, updateApiSchema, amplifyPush, amplifyPull, getAppId } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import { pathManager } from 'amplify-cli-core';
import { addEnvironment } from '../environment/env';

describe('feature flags', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('feature-flags');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init the project and cli.json should be created', async () => {
    await initJSProjectWithProfile(projRoot, {});

    expect(fs.existsSync(pathManager.getCLIJSONFilePath(projRoot))).toBeTruthy();
  });

  it('push and pull with multiple config files for environments', async () => {
    await initJSProjectWithProfile(projRoot, {
      name: 'apifeatureflag',
      disableAmplifyAppCreation: false,
    });
    await addApiWithoutSchema(projRoot);
    await updateApiSchema(projRoot, 'apifeatureflag', 'simple_model.graphql');

    const envName = 'test';
    const cliJSONPath = pathManager.getCLIJSONFilePath(projRoot);
    const testCLIJSONPath = pathManager.getCLIJSONFilePath(projRoot, envName);

    fs.copyFileSync(cliJSONPath, testCLIJSONPath);

    await amplifyPush(projRoot);

    const appId = getAppId(projRoot);
    expect(appId).toBeDefined();

    let projRoot2;

    try {
      projRoot2 = await createNewProjectDir('feature-flags-pull');

      await amplifyPull(projRoot2, { override: false, emptyDir: true, appId });

      expect(fs.existsSync(cliJSONPath)).toBeTruthy();
      expect(fs.existsSync(testCLIJSONPath)).toBeTruthy();
    } finally {
      deleteProjectDir(projRoot2);
    }
  });

  it('config is cloned when new environment is created', async () => {
    await initJSProjectWithProfile(projRoot, {});

    const envName = 'test';
    const cliJSONPath = pathManager.getCLIJSONFilePath(projRoot);
    const cliDevJSONPath = pathManager.getCLIJSONFilePath(projRoot, 'integtest');

    fs.copyFileSync(cliJSONPath, cliDevJSONPath);

    await addEnvironment(projRoot, { envName });

    const testCLIJSONPath = pathManager.getCLIJSONFilePath(projRoot, envName);
    expect(fs.existsSync(testCLIJSONPath)).toBeTruthy();
  });
});
