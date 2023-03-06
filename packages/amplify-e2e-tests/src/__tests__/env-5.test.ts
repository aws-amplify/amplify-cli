/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  addAuthWithDefaultSocial,
  amplifyPushAuth,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import { addEnvironmentHostedUI, listEnvironment, pullEnvironment } from '../environment/env';

const validate = async (meta: any): Promise<void> => {
  expect(meta.providers.awscloudformation).toBeDefined();
  const { AuthRoleArn: authRoleArn, DeploymentBucketName: bucketName, Region: region, StackId: stackId } = meta.providers.awscloudformation;

  expect(authRoleArn).toBeDefined();
  expect(region).toBeDefined();
  expect(stackId).toBeDefined();
  const bucketExists = await checkIfBucketExists(bucketName, region);
  expect(bucketExists).toMatchObject({});
};

describe('environment commands with HostedUI params', () => {
  let projRoot: string;
  beforeAll(async () => {
    projRoot = await createNewProjectDir('env-test');
    await initJSProjectWithProfile(projRoot, { envName: 'enva' });
    await addAuthWithDefaultSocial(projRoot);
    await amplifyPushAuth(projRoot);
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add and checkout environment', async () => {
    await addEnvironmentHostedUI(projRoot, { envName: 'envb' });
    await listEnvironment(projRoot, { numEnv: 2 });
    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });

  it('init a project, pull environment', async () => {
    await pullEnvironment(projRoot);
    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });
});
