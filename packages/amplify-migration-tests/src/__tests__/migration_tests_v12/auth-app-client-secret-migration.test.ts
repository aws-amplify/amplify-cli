import {
  addAuthWithDefault,
  amplifyPullNonInteractive,
  amplifyPushAuth,
  amplifyPushForce,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
  assertAppClientSecretInFiles,
  updateAuthAddUserGroups,
  addHeadlessAuth,
  amplifyPushNonInteractive,
  updateHeadlessAuth,
  updateCLIParametersToGenerateUserPoolClientSecret,
} from '@aws-amplify/amplify-e2e-core';
import { allowedVersionsToMigrateFrom, versionCheck } from '../../migration-helpers';
import { initAndroidProjectWithProfileV12 } from '../../migration-helpers-v12/init';
import { pullPushForceWithLatestCodebaseValidateParameterAndCfnDrift } from '../../migration-helpers/utils';
import { AddAuthRequest, CognitoUserPoolSigninMethod, CognitoUserProperty, UpdateAuthRequest } from 'amplify-headless-interface';

const defaultsSettings = {
  name: 'authTest',
  disableAmplifyAppCreation: false,
};

describe('amplify add auth...', () => {
  let projRoot: string;
  const projectName: string = 'authAppClientSecret';

  beforeAll(async () => {
    const migrateFromVersion = { v: 'uninitialized' };
    const migrateToVersion = { v: 'uninitialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    console.log(`Test migration from: ${migrateFromVersion.v} to ${migrateToVersion.v}`);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir(projectName);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  describe('starting interactively with old...', () => {
    beforeEach(async () => {
      await initAndroidProjectWithProfileV12(projRoot, defaultsSettings);
      await addAuthWithDefault(projRoot);
      await amplifyPushAuth(projRoot);
      updateCLIParametersToGenerateUserPoolClientSecret(projRoot);
    });

    it('...should init an Android project and add default auth', async () => {
      await amplifyPushAuth(projRoot);
      // assert client secret in projRoot
      await assertAppClientSecretInFiles(projRoot, 'android');
      const projRoot2 = await createNewProjectDir(`${projectName}2`);
      const projRoot3 = await createNewProjectDir(`${projectName}3`);
      // using amplify push force here as changes are only related to build files
      await pullPushForceWithLatestCodebaseValidateParameterAndCfnDrift(projRoot, projRoot2);
      const appId = getAppId(projRoot);
      expect(appId).toBeDefined();
      const frontendConfig = {
        frontend: 'android',
        config: {
          ResDir: 'app/src/main/res',
        },
      };
      const envName = 'integtest';
      try {
        await amplifyPullNonInteractive(projRoot3, {
          appId,
          frontend: frontendConfig,
          envName,
        });
        await amplifyPushForce(projRoot3, true);
        await assertAppClientSecretInFiles(projRoot3, 'android');
      } finally {
        deleteProjectDir(projRoot3);
      }
    });

    it('update auth and push with latest interactively, write secret', async () => {
      await updateAuthAddUserGroups(projRoot, ['group1', 'group2'], { testingWithLatestCodebase: true });
      updateCLIParametersToGenerateUserPoolClientSecret(projRoot);
      await amplifyPushAuth(projRoot, true);
      await assertAppClientSecretInFiles(projRoot, 'android');
    });
  });

  describe('starting non-interactively with old...', () => {
    beforeEach(async () => {
      await initAndroidProjectWithProfileV12(projRoot, defaultsSettings);
      const addAuthRequest: AddAuthRequest = {
        version: 2,
        resourceName: 'myAuthResource',
        serviceConfiguration: {
          serviceName: 'Cognito',
          includeIdentityPool: false,
          userPoolConfiguration: {
            requiredSignupAttributes: [CognitoUserProperty.EMAIL, CognitoUserProperty.PHONE_NUMBER],
            // eslint-disable-next-line spellcheck/spell-checker
            signinMethod: CognitoUserPoolSigninMethod.USERNAME,
          },
        },
      };
      await addHeadlessAuth(projRoot, addAuthRequest);
      updateCLIParametersToGenerateUserPoolClientSecret(projRoot, addAuthRequest.resourceName);
      await amplifyPushNonInteractive(projRoot);
    });

    it('update auth and push with latest non-interactively, write secret', async () => {
      const updateAuthRequest: UpdateAuthRequest = {
        version: 2,
        serviceModification: {
          serviceName: 'Cognito',
          userPoolModification: {
            autoVerifiedAttributes: [
              {
                type: 'EMAIL',
              },
            ],
            userPoolGroups: [
              {
                groupName: 'group1',
              },
              {
                groupName: 'group2',
              },
            ],
          },
          includeIdentityPool: false,
        },
      };

      await updateHeadlessAuth(projRoot, updateAuthRequest, { testingWithLatestCodebase: true });
      updateCLIParametersToGenerateUserPoolClientSecret(projRoot);
      await amplifyPushNonInteractive(projRoot, true);
      await assertAppClientSecretInFiles(projRoot, 'android');
    });
  });
});
