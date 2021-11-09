import * as fs from 'fs-extra';
import * as path from 'path';
import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyOverrideRoot,
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  amplifyPushOverride,
} from 'amplify-e2e-core';
import { JSONUtilities } from 'amplify-cli-core';

describe('amplify init', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('init');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('should init the project and override root and push', async () => {
    await initJSProjectWithProfile(projRoot, {});
    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    // turn ON feature flag
    const cliJsonPath = path.join(projRoot, 'amplify', 'cli.json');
    const cliJSON = JSONUtilities.readJson(cliJsonPath);
    const modifiedCliJson = Object.assign(cliJSON, { overrides: { project: true } });
    JSONUtilities.writeJson(cliJsonPath, modifiedCliJson);
    // override new env
    await amplifyOverrideRoot(projRoot, {});
    const srcOverrideFilePath = path.join(__dirname, '..', '..', '..', '..', '..', 'amplify-e2e-tests', 'overrides', 'override-root.ts');
    const destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'awscloudformation', 'override.ts');
    fs.copyFileSync(srcOverrideFilePath, destOverrideFilePath);
    await amplifyPushOverride(projRoot);
    const newEnvMeta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(newEnvMeta.AuthRoleName).toEqual('mockRole');
  });
});
