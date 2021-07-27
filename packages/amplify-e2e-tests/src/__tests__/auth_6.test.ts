import {
  initJSProjectWithProfile,
  getProjectMeta,
  deleteProject,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProjectDir,
  addAuthWithMaxOptions,
} from 'amplify-e2e-core';
import _ from 'lodash';

const PROJECT_NAME = 'authTest';
const defaultsSettings = {
  name: PROJECT_NAME,
};
describe('zero config auth ', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('zero-config-auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it.only('...should init a javascript project and add auth with a all uptions and update front end config', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithMaxOptions(projRoot, { useInclusiveTerminology: false });
    await amplifyPushAuth(projRoot);
    let meta = getProjectMeta(projRoot);

    let id = Object.keys(meta.auth)[0];
    let authMeta = meta.auth[id];

    expect(authMeta.frontEndConfig).toBeDefined();
    expect(authMeta.frontEndConfig.loginMechanism).toBeDefined();
    expect(authMeta.frontEndConfig.signupAttributes).toBeDefined();
    expect(authMeta.frontEndConfig.mfaConfiguration).toBeDefined();
    expect(authMeta.frontEndConfig.mfaTypes).toBeDefined();
    expect(authMeta.frontEndConfig.passwordProtectionSettings).toBeDefined();
  });
});
