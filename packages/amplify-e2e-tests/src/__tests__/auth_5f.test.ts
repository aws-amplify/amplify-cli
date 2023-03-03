/* eslint-disable import/no-extraneous-dependencies */
import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  removeHeadlessAuth,
  getCloudBackendConfig,
  addAuthWithDefault,
  getBackendAmplifyMeta,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import _ from 'lodash';

const PROJECT_NAME = 'authTest';
const defaultsSettings = {
  name: PROJECT_NAME,
};

describe('headless auth f', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth-update');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('removes auth resource', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot);
    await amplifyPushAuth(projRoot);
    const { auth: authBefore } = getBackendAmplifyMeta(projRoot);
    const authResourceName = _.keys(authBefore).find(() => true); // first element or undefined
    expect(authResourceName).toBeDefined();
    const { auth: authBackendConfigBefore } = getCloudBackendConfig(projRoot);
    expect(_.isEmpty(authBackendConfigBefore)).toBe(false);
    await removeHeadlessAuth(projRoot, authResourceName);
    await amplifyPushAuth(projRoot);
    const { auth: authAfter } = getBackendAmplifyMeta(projRoot);
    expect(_.isEmpty(authAfter)).toBe(true);
    const { auth: authBackendConfigAfter } = getCloudBackendConfig(projRoot);
    expect(_.isEmpty(authBackendConfigAfter)).toBe(true);
  });
});
