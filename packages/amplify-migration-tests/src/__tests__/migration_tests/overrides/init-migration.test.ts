import * as path from 'path';
import {
  deleteProject,
  amplifyOverrideRoot,
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
  amplifyPushOverride,
  replaceOverrideFileWithProjectInfo,
} from '@aws-amplify/amplify-e2e-core';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { versionCheck, allowedVersionsToMigrateFrom, initJSProjectWithProfileV4_52_0 } from '../../../migration-helpers';

describe('amplify init', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('init');
    const migrateFromVersion = { v: 'unintialized' };
    const migrateToVersion = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  afterEach(async () => {
    await deleteProject(projRoot, undefined, true);
    deleteProjectDir(projRoot);
  });

  it('should init the project and override root and push', async () => {
    const projectName = 'initMigrationTest';
    await initJSProjectWithProfileV4_52_0(projRoot, { name: projectName });
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
    replaceOverrideFileWithProjectInfo(srcOverrideFilePath, destOverrideFilePath, 'integtest', projectName);
    await amplifyPushOverride(projRoot, true);
    const newEnvMeta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(newEnvMeta.AuthRoleName).toContain('mockRole');
  });
});
