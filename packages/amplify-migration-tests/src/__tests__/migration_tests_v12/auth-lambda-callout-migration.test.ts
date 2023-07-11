import type { IAmplifyResource } from '@aws-amplify/amplify-cli-core';
import {
  addAuthWithMaxOptions,
  amplifyPushAuth,
  amplifyPushForce,
  createNewProjectDir,
  configureAmplify,
  deleteProject,
  deleteProjectDir,
  generateRandomShortId,
  getCloudFormationTemplate,
  getProjectMeta,
  listUsersInUserPool,
  setupUser,
  signInUser,
  signOutUser,
  updateHeadlessAuth,
} from '@aws-amplify/amplify-e2e-core';
import { UpdateAuthRequest } from 'amplify-headless-interface';
import { validateVersionsForMigrationTest } from '../../migration-helpers';
import { expectLambdasInCfnTemplate, migratedLambdas, nonMigratedLambdas } from '../../migration-helpers-v12/auth-helpers/utilities';
import { initJSProjectWithProfileV12 } from '../../migration-helpers-v12/init';

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
    await initJSProjectWithProfileV12(projRoot, defaultsSettings);
    const resourceName = `test${generateRandomShortId()}`;
    await addAuthWithMaxOptions(projRoot, { name: resourceName });

    const preMigrationTemplate = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectLambdasInCfnTemplate(preMigrationTemplate, migratedLambdas.concat(nonMigratedLambdas), []);

    // push with latest should regenerate auth stack and start migrating lambda callouts
    await amplifyPushAuth(projRoot, true);

    // a second push with latest should finish migrating the lambda callouts
    await amplifyPushForce(projRoot, true);

    const postMigrationTemplate = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectLambdasInCfnTemplate(preMigrationTemplate, nonMigratedLambdas, migratedLambdas);

    // revert to previous CLI version
    await amplifyPushForce(projRoot, false);

    const revertTemplate = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectLambdasInCfnTemplate(revertTemplate, migratedLambdas.concat(nonMigratedLambdas), []);
  });

  it('should migrate when force pushing without affecting user pool functionality', async () => {
    await initJSProjectWithProfileV12(projRoot, defaultsSettings);

    const resourceName = `test${generateRandomShortId()}`;
    await addAuthWithMaxOptions(projRoot, { name: resourceName });

    await amplifyPushAuth(projRoot, false);

    const meta = getProjectMeta(projRoot);
    expect(meta?.providers?.awscloudformation?.Region).toBeDefined();
    expect(meta?.auth).toBeDefined();
    const region = meta.providers.awscloudformation.Region;
    const { UserPoolId } = Object.values(meta.auth as Record<string, IAmplifyResource & { output: { UserPoolId: string } }>).find(
      (resource) => resource.service === 'Cognito',
    ).output;

    await configureAmplify(projRoot);

    const username = 'testUser';
    const password = 'Password12#';
    await setupUser(UserPoolId, username, 'Password12#', 'userPoolGroup1');

    await signInUser(username, password);
    await signOutUser();

    await amplifyPushForce(projRoot, true);

    let users = await listUsersInUserPool(UserPoolId, region);
    expect(users).toEqual([username.toLowerCase()]);

    await signInUser(username, password);
    await signOutUser();

    await amplifyPushForce(projRoot, true);

    users = await listUsersInUserPool(UserPoolId, region);
    expect(users).toEqual([username.toLowerCase()]);

    await signInUser(username, password);
    await signOutUser();
  });

  it('should be migrated when set up using headless commands', async () => {
    await initJSProjectWithProfileV12(projRoot, defaultsSettings);
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
    await amplifyPushForce(projRoot, true);

    const template = await getCloudFormationTemplate(projRoot, 'auth', resourceName);
    expectLambdasInCfnTemplate(template, nonMigratedLambdas, migratedLambdas);
  });
});
