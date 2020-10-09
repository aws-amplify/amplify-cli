import * as fs from 'fs-extra';
import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  addHeadlessAuth,
  updateHeadlessAuth,
  removeHeadlessAuth,
} from 'amplify-e2e-core';
import { addAuthWithDefault, getBackendAmplifyMeta } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getUserPool } from 'amplify-e2e-core';
import { AddAuthRequest, CognitoUserPoolSigninMethod, CognitoUserProperty, UpdateAuthRequest } from 'amplify-headless-interface';
import _ from 'lodash';

const defaultsSettings = {
  name: 'authTest',
};

describe('headless auth', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth-update');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });
  it('adds auth resource', async () => {
    const addAuthRequest: AddAuthRequest = {
      version: 1,
      resourceName: 'myAuthResource',
      serviceConfiguration: {
        serviceName: 'Cognito',
        includeIdentityPool: false,
        userPoolConfiguration: {
          requiredSignupAttributes: [CognitoUserProperty.EMAIL, CognitoUserProperty.PHONE_NUMBER],
          signinMethod: CognitoUserPoolSigninMethod.USERNAME,
        },
      },
    };

    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addHeadlessAuth(projRoot, addAuthRequest);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
  });

  it('updates existing auth resource', async () => {
    const updateAuthRequest: UpdateAuthRequest = {
      version: 1,
      serviceModification: {
        serviceName: 'Cognito',
        userPoolModification: {
          userPoolGroups: [
            {
              groupName: 'group1',
            },
            {
              groupName: 'group2',
            },
          ],
        },
        includeIdentityPool: true,
        identityPoolModification: {
          unauthenticatedLogin: true,
        },
      },
    };

    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    await updateHeadlessAuth(projRoot, updateAuthRequest);
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map(key => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
    expect(_.get(meta, ['auth', 'userPoolGroups'])).toBeDefined();
  });

  it('removes auth resource', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot, {});
    const { auth: authBefore } = getBackendAmplifyMeta(projRoot);
    const authResourceName = _.keys(authBefore).find(() => true); // first element or undefined
    await removeHeadlessAuth(projRoot, authResourceName);
    const { auth: authAfter } = getBackendAmplifyMeta(projRoot);
    expect(_.isEmpty(authAfter)).toBe(true);
  });
});
