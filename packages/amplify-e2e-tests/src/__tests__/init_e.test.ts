/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  amplifyOverrideRoot,
  amplifyPushOverride,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAmplifyInitConfig,
  getProjectMeta,
  gitCleanFdx,
  gitCommitAll,
  gitInit,
  initJSProjectWithProfile,
  listRolePolicies,
  nonInteractiveInitWithForcePushAttach,
  replaceOverrideFileWithProjectInfo,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';

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
    const projectName = 'initTest';
    await initJSProjectWithProfile(projRoot, { name: projectName });
    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName } = meta;

    expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);

    // override new env
    await amplifyOverrideRoot(projRoot, { testingWithLatestCodebase: false });

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

    // test with valid file
    const srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-root.ts');
    replaceOverrideFileWithProjectInfo(srcOverrideFilePath, destOverrideFilePath, 'integtest', projectName);
    // should throw error if AMPLIFY_CLI_DISABLE_SCRIPTING_FEATURES is set
    process.env.AMPLIFY_CLI_DISABLE_SCRIPTING_FEATURES = 'true';
    await expect(amplifyPushOverride(projRoot)).rejects.toThrowError();
    // unset
    delete process.env.AMPLIFY_CLI_DISABLE_SCRIPTING_FEATURES;
    // should succeed now
    await amplifyPushOverride(projRoot);
    const newEnvMeta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(newEnvMeta.AuthRoleName).toContain('mockRole');

    // create a new env, and the override should remain in place
    replaceOverrideFileWithProjectInfo(srcOverrideFilePath, destOverrideFilePath, 'envb', projectName);
    await addEnvironment(projRoot, { envName: 'envb' });
    const newestEnvMeta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(newestEnvMeta.AuthRoleName).toContain('mockRole');

    // test special scenario where override.js is manually edited by customer & is invalid
    // this should throw when creating a new environment
    const destOverrideJSFilePath = path.join(projRoot, 'amplify', 'backend', 'awscloudformation', 'build', 'override.js');
    const srcInvalidOverrideJSRuntimeError = path.join(__dirname, '..', '..', 'overrides', 'override-js-error.txt');
    fs.copyFileSync(srcInvalidOverrideJSRuntimeError, destOverrideJSFilePath);
    await expect(addEnvironment(projRoot, { envName: 'envc' })).rejects.toThrowError();

    // checking if git project also overrides
    replaceOverrideFileWithProjectInfo(srcOverrideFilePath, destOverrideFilePath, 'integtest', projectName);
    await gitInit(projRoot);
    await gitCommitAll(projRoot);
    await gitCleanFdx(projRoot);
    await nonInteractiveInitWithForcePushAttach(projRoot, getAmplifyInitConfig(projectName, 'integtest'), undefined, false);
    // check if overrides are applied
    const gitClonedMeta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(await listRolePolicies(gitClonedMeta.AuthRoleName, gitClonedMeta.Region)).toMatchInlineSnapshot(`
      [
        "ApiGatewayPolicy",
        "RekognitionPolicy",
      ]
    `);
  });
});
