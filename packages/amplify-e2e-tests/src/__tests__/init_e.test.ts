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

    // test default vscode settings.json for awscloudformation folder
    const editorSettingsPath = path.join(projRoot, '.vscode', 'settings.json');
    const editorSettings = fs.readJSONSync(editorSettingsPath);
    expect(editorSettings['files.exclude']['amplify/backend/awscloudformation']).toEqual(true);

    await expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    await expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    await expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);

    // override new env
    console.log('attempting to overrider root');
    await amplifyOverrideRoot(projRoot, { testingWithLatestCodebase: false });

    // test awscloudformation folder is not excluded in vscode settings.json after override
    const editorSettingsAfterOverride = fs.readJSONSync(editorSettingsPath);
    expect(editorSettingsAfterOverride['files.exclude']['amplify/backend/awscloudformation']).toEqual(false);

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
    console.log('replacing override file');
    replaceOverrideFileWithProjectInfo(srcOverrideFilePath, destOverrideFilePath, 'integtest', projectName);
    // should throw error if AMPLIFY_CLI_DISABLE_SCRIPTING_FEATURES is set
    await expect(amplifyPushOverride(projRoot, false, { AMPLIFY_CLI_DISABLE_SCRIPTING_FEATURES: 'true' })).rejects.toThrowError();
    // should succeed now
    console.log('pushing override');
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
