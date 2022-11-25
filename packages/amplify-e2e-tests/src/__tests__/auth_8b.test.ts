import * as fs from 'fs-extra';
import * as path from 'path';
import {
  addAuthWithDefault,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  getUserPool,
  initFlutterProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';

const defaultsSettings = {
  name: 'authTest',
};

describe('amplify add auth...', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });


  it('...should init a Flutter project and add auth with defaults', async () => {
    await initFlutterProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
    expect(fs.existsSync(path.join(projRoot, 'lib', 'amplifyconfiguration.dart'))).toBe(true);
  });

});
