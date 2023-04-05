import {
  addAuthWithDefault,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getCLIInputs,
  getProjectMeta,
  setCLIInputs,
} from '@aws-amplify/amplify-e2e-core';
import { allowedVersionsToMigrateFrom, versionCheck } from '../../migration-helpers';
import { initIosProjectWithProfile11 } from '../../migration-helpers-v11/init';
import { assertAppClientSecretInFiles, pullPushForceWithLatestCodebaseValidateParameterAndCfnDrift } from '../../migration-helpers/utils';

const defaultsSettings = {
  name: 'authTest',
  disableAmplifyAppCreation: false,
};

describe('amplify add auth...', () => {
  let projRoot: string;
  const projectName: string = 'authAppClientSecret';

  beforeAll(async () => {
    const migrateFromVersion = { v: 'unintialized' };
    const migrateToVersion = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    console.log(`Test migration from: ${migrateFromVersion.v} to ${migrateToVersion.v}`);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir(projectName);
    await initIosProjectWithProfile11(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot);
    await amplifyPushAuth(projRoot);
    let meta = getProjectMeta(projRoot);
    let id = Object.keys(meta.auth)[0];
    // update parameter to generate client Secret
    const parameters = getCLIInputs(projRoot, 'auth', id);
    parameters.cognitoConfig.userpoolClientGenerateSecret = true;
    setCLIInputs(projRoot, 'auth', id, parameters);
    await amplifyPushAuth(projRoot);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should init an IOS project and add default auth', async () => {
    // assert client secret in projRoot
    await assertAppClientSecretInFiles(projRoot);
    const projRoot2 = await createNewProjectDir(`${projectName}2`);
    await pullPushForceWithLatestCodebaseValidateParameterAndCfnDrift(projRoot, projRoot2);
  });
});
