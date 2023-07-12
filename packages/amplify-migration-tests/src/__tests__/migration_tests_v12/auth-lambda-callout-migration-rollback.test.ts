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
  getProjectMeta,
  listUsersInUserPool,
  setupUser,
  signInUser,
  signOutUser,
  getUserPool,
  listSocialIdpProviders,
  initJSProjectWithProfile,
  addS3StorageWithIdpAuth,
} from '@aws-amplify/amplify-e2e-core';
import { validateVersionsForMigrationTest } from '../../migration-helpers';

const defaultsSettings = {
  name: 'authTest',
  disableAmplifyAppCreation: true,
};

describe('lambda callouts rollback', () => {
  let projRoot: string;
  const projectName: string = 'lambdaRollback';

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

  it('should rollback without affecting user pool functionality', async () => {
    await initJSProjectWithProfile(projRoot, { ...defaultsSettings, testingWithLatestCodebase: true });

    const resourceName = `test${generateRandomShortId()}`;
    await addAuthWithMaxOptions(projRoot, { name: resourceName, testingWithLatestCodebase: true });

    await amplifyPushAuth(projRoot, true);

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
    await setupUser(UserPoolId, username, 'Password12#', 'userPoolGroup1', region);

    await signInUser(username, password);
    await signOutUser();

    await amplifyPushForce(projRoot, false);

    const users = await listUsersInUserPool(UserPoolId, region);
    expect(users).toEqual([username.toLowerCase()]);

    await signInUser(username, password);
    await signOutUser();
  });

  it('should keep identity providers and domain during rollback', async () => {
    await initJSProjectWithProfile(projRoot, { ...defaultsSettings, testingWithLatestCodebase: true });

    const resourceName = `test${generateRandomShortId()}`;
    await addAuthWithMaxOptions(projRoot, { name: resourceName, testingWithLatestCodebase: true });

    await amplifyPushAuth(projRoot, true);

    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const { UserPoolId } = Object.keys(meta.auth)
      .map((key) => meta.auth[key])
      .find((auth) => auth.service === 'Cognito').output;
    const userPoolRes1 = await getUserPool(UserPoolId, region);
    const userPoolDomainLatest = userPoolRes1.UserPool.Domain;
    const socialIdpProvidersLatest = await listSocialIdpProviders(UserPoolId, region);

    await amplifyPushForce(projRoot, false);

    const userPoolRes2 = await getUserPool(UserPoolId, region);
    const userPoolDomainV12 = userPoolRes2.UserPool.Domain;
    const socialIdpProvidersV12 = await listSocialIdpProviders(UserPoolId, region);

    // check same domain should exist
    expect(userPoolDomainV12).toEqual(userPoolDomainLatest);
    // check the Social Idp Provider exists
    expect(socialIdpProvidersV12).toEqual(socialIdpProvidersLatest);
  });

  it('can rollback, add new other resource and push', async () => {
    await initJSProjectWithProfile(projRoot, { ...defaultsSettings, testingWithLatestCodebase: true });

    const resourceName = `test${generateRandomShortId()}`;
    await addAuthWithMaxOptions(projRoot, { name: resourceName, testingWithLatestCodebase: true });

    await amplifyPushAuth(projRoot, true);

    await addS3StorageWithIdpAuth(projRoot, false);

    await amplifyPushAuth(projRoot, false);
  });
});
