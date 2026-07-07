/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  addAuthWithDefault,
  amplifyPull,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import { addEnvironment, checkoutEnvironment, listEnvironment, removeEnvironment } from '../environment/env';

const validate = async (meta: any): Promise<void> => {
  expect(meta.providers.awscloudformation).toBeDefined();
  const { AuthRoleArn: authRoleArn, DeploymentBucketName: bucketName, Region: region, StackId: stackId } = meta.providers.awscloudformation;

  expect(authRoleArn).toBeDefined();
  expect(region).toBeDefined();
  expect(stackId).toBeDefined();
  const bucketExists = await checkIfBucketExists(bucketName, region);
  expect(bucketExists).toMatchObject({});
};

describe('environment commands', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('env-test');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add environments, list them, then remove them', async () => {
    await initJSProjectWithProfile(projRoot, { envName: 'enva' });
    await listEnvironment(projRoot, {});
    await addEnvironment(projRoot, { envName: 'envb' });
    await listEnvironment(projRoot, { numEnv: 2 });
    await checkoutEnvironment(projRoot, { envName: 'enva' });
    await removeEnvironment(projRoot, { envName: 'envb' });
    await listEnvironment(projRoot, {});

    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });

  it('init a project, pull, add auth, pull to override auth change', async () => {
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    await amplifyPull(projRoot, { override: false });
    await addAuthWithDefault(projRoot);
    await amplifyPull(projRoot, { override: true });

    const meta = getProjectMeta(projRoot);
    await validate(meta);
  });
});
