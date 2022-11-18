/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyOverrideRoot,
  amplifyPushOverride,
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
} from '@aws-amplify/amplify-e2e-core';

import { addEnvironment } from '../environment/env';

describe('amplify init e', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('init');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('should init the project and override root and push', async () => {
    await initJSProjectWithProfile(projRoot, {});
    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const {
      AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName,
    } = meta;

    expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);

    // override new env
    await amplifyOverrideRoot(projRoot, { testingWithLatestCodebase: true });

    // this is where we will write overrides to
    const destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'awscloudformation', 'override.ts');

    // test override file in compilation error state
    const srcInvalidOverrideCompileError = path.join(__dirname, '..', '..', 'overrides', 'override-compile-error.txt');
    fs.copyFileSync(srcInvalidOverrideCompileError, destOverrideFilePath);
    await expect(amplifyPushOverride(projRoot)).rejects.toThrowError();

    // test override file in runtime error state
    const srcInvalidOverrideRuntimeError = path.join(__dirname, '..', '..', 'overrides', 'override-runtime-error.txt');
    fs.copyFileSync(srcInvalidOverrideRuntimeError, destOverrideFilePath);
    await expect(amplifyPushOverride(projRoot)).rejects.toThrowError();

    // test happy path
    const srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-root.ts');
    fs.copyFileSync(srcOverrideFilePath, destOverrideFilePath);
    await amplifyPushOverride(projRoot);
    const newEnvMeta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(newEnvMeta.AuthRoleName).toContain('mockRole');

    // create a new env, and the override should remain in place
    await addEnvironment(projRoot, { envName: 'envb' });
    const newestEnvMeta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(newestEnvMeta.AuthRoleName).toContain('mockRole');

    // test special scenario where override.js is manually edited by customer & is invalid
    // this should throw when creating a new environment
    const destOverrideJSFilePath = path.join(projRoot, 'amplify', 'backend', 'awscloudformation', 'build', 'override.js');
    const srcInvalidOverrideJSRuntimeError = path.join(__dirname, '..', '..', 'overrides', 'override-js-error.txt');
    fs.copyFileSync(srcInvalidOverrideJSRuntimeError, destOverrideJSFilePath);
    await expect(addEnvironment(projRoot, { envName: 'envc' })).rejects.toThrowError();
  });
});
