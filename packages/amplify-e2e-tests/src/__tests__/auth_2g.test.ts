/* eslint-disable spellcheck/spell-checker */
import {
  addAuthWithDefaultSocial,
  addFunction,
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateRandomShortId,
  getAppId,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';

const defaultsSettings = {
  name: 'authTest',
};

describe('amplify add auth...', () => {
  let projRoot: string;
  let projRoot2;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
    projRoot2 = await createNewProjectDir('auth2');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
    deleteProjectDir(projRoot2);
  });

  it('...should init a project and add auth with defaultSocial and pull should succeed', async () => {
    await initJSProjectWithProfile(projRoot, { ...defaultsSettings, disableAmplifyAppCreation: false });
    await addAuthWithDefaultSocial(projRoot);
    await amplifyPushAuth(projRoot);
    const appId = getAppId(projRoot);
    // amplify pull should work
    const functionName = `testcorsfunction${generateRandomShortId()}`;
    await addFunction(projRoot, { functionTemplate: 'Hello World', name: functionName }, 'nodejs');
    await amplifyPull(projRoot2, { emptyDir: true, appId, envName: 'integtest', yesFlag: true });
  });
});
