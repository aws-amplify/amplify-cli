import type { IAmplifyResource } from '@aws-amplify/amplify-cli-core';
import {
  addAuthWithMaxOptions,
  addAuthWithOidcForNonJSProject,
  addUserToUserPool,
  amplifyPushAuth,
  amplifyPushForce,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateRandomShortId,
  getProjectMeta,
  getCloudFormationTemplate,
  listUsersInUserPool,
  updateAuthSignInSignOutUrl,
  updateHeadlessAuth,
} from '@aws-amplify/amplify-e2e-core';
import { UpdateAuthRequest } from 'amplify-headless-interface';
import { validateVersionsForMigrationTest } from '../../migration-helpers';
import { expectLambdasInCfnTemplate, expectNoLambdasInCfnTemplate } from '../../migration-helpers-v11/auth-helpers/utilities';
import { initIosProjectWithProfile11, initJSProjectWithProfileV11 } from '../../migration-helpers-v11/init';

const defaultsSettings = {
  name: 'authTest',
  disableAmplifyAppCreation: true,
};

describe('lambda callouts', () => {
  let projRoot: string;
  const projectName: string = 'lambdaRemove';

  beforeAll(async () => {
    await validateVersionsForMigrationTest();
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir(projectName);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('should be migrated when auth is in the create state, then reverted back', async () => {
    await initJSProjectWithProfileV11(projRoot, defaultsSettings);
    const resourceName = `test${generateRandomShortId()}`;
    await addAuthWithMaxOptions(projRoot, { name: resourceName });

    const preMigrationTemplate = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectLambdasInCfnTemplate(preMigrationTemplate);

    // push with latest should regenerate auth stack and remove lambda callouts
    await amplifyPushAuth(projRoot, true);

    const postMigrationTemplate = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectNoLambdasInCfnTemplate(postMigrationTemplate);

    // revert back to previous CLI version
    await amplifyPushForce(projRoot, false);

    const revertTemplate = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectLambdasInCfnTemplate(revertTemplate);
  });

  it('should migrate when force pushing without affecting userpool functionality', async () => {
    await initJSProjectWithProfileV11(projRoot, defaultsSettings);

    const resourceName = `test${generateRandomShortId()}`;
    await addAuthWithMaxOptions(projRoot, { name: resourceName });

    const preMigrationTemplate = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectLambdasInCfnTemplate(preMigrationTemplate);

    await amplifyPushAuth(projRoot, false);

    const meta = getProjectMeta(projRoot);
    expect(meta?.providers?.awscloudformation?.Region).toBeDefined();
    expect(meta?.auth).toBeDefined();
    const region = meta.providers.awscloudformation.Region;
    const { UserPoolId } = Object.values(meta.auth as Record<string, IAmplifyResource & { output: { UserPoolId: string } }>).find(
      (resource) => resource.service === 'Cognito',
    ).output;

    await addUserToUserPool(UserPoolId, region);

    await amplifyPushForce(projRoot, true);

    const users = await listUsersInUserPool(UserPoolId, region);
    expect(users).toBe(['testUser']);

    const postigrationTemplate = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectNoLambdasInCfnTemplate(postigrationTemplate);
  });

  it('should be migrated after updating auth with OIDC', async () => {
    await initIosProjectWithProfile11(projRoot, defaultsSettings);
    const resourceName = `test${generateRandomShortId()}`;
    await addAuthWithOidcForNonJSProject(projRoot, { resourceName, frontend: 'ios' });
    await amplifyPushAuth(projRoot, false);

    await updateAuthSignInSignOutUrl(projRoot, {
      socialProvidersAlreadyExist: true,
      signinUrl: 'https://www.google.com/',
      signoutUrl: 'https://www.nytimes.com/',
      updatesigninUrl: 'https://www.amazon.com/',
      updatesignoutUrl: 'https://www.amazon.com/',
      testingWithLatestCodebase: true,
    });
    await amplifyPushAuth(projRoot, true);

    const template = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectNoLambdasInCfnTemplate(template);
  });

  it('should be migrated when set up using headless commands', async () => {
    await initJSProjectWithProfileV11(projRoot, defaultsSettings);
    const resourceName = `test${generateRandomShortId()}`;
    await addAuthWithMaxOptions(projRoot, { name: resourceName });
    await amplifyPushAuth(projRoot, false);

    const updateAuthRequest: UpdateAuthRequest = {
      version: 2,
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
          identitySocialFederation: [{ provider: 'GOOGLE', clientId: 'fakeClientId' }],
        },
      },
    };

    await updateHeadlessAuth(projRoot, updateAuthRequest, { testingWithLatestCodebase: true });
    await amplifyPushAuth(projRoot, true);

    const template = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectNoLambdasInCfnTemplate(template);
  });
});
