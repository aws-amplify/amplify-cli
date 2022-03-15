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
import { versionCheck, allowedVersionsToMigrateFrom } from '../../../migration-helpers';

describe('amplify init', () => {
  let projRoot: string;

  beforeAll(async () => {
    const migrateFromVersion = { v: 'unintialized' };
    const migrateToVersion = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir('init');
  });

  afterEach(async () => {
    await deleteProject(projRoot, undefined, true);
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
    await amplifyOverrideRoot(projRoot, { testingWithLatestCodebase: true });
    const srcOverrideFilePath = path.join(__dirname, '..', '..', '..', '..', '..', 'amplify-e2e-tests', 'overrides', 'override-root.ts');
    const destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'awscloudformation', 'override.ts');
    fs.copyFileSync(srcOverrideFilePath, destOverrideFilePath);
    await amplifyPushOverride(projRoot, true);
    const newEnvMeta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(newEnvMeta.AuthRoleName).toContain('mockRole');
  });
});
