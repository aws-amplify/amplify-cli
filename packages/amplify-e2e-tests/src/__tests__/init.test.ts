import * as fs from 'fs-extra';
import * as path from 'path';
import {
  initJSProjectWithProfile,
  deleteProject,
  initProjectWithAccessKey,
  initNewEnvWithAccessKey,
  initNewEnvWithProfile,
  amplifyStatus,
  getAdminApp,
  amplifyPullSandbox,
  amplifyInitSandbox,
  getProjectSchema,
  amplifyPush,
  amplifyOverrideRoot,
  amplifyPushOverride,
  createNewProjectDir,
  deleteProjectDir,
  getEnvVars,
  getProjectMeta,
} from 'amplify-e2e-core';

import { addEnvironment } from '../environment/env';

import { JSONUtilities } from 'amplify-cli-core';
import { SandboxApp } from '../types/SandboxApp';

describe('amplify init', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('init');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('should pull sandbox and download schema', async () => {
    const schemaBody = {
      schema:
        '    type Todo @model @auth(rules: [{allow: public}]) {        id: ID!        name: String!        description: String    }    ',
      shareable: 'true',
    };
    const sandBoxAppString = await getAdminApp(schemaBody);
    expect(sandBoxAppString).toBeDefined();
    const sandboxApp = JSONUtilities.parse<SandboxApp>(sandBoxAppString);
    expect(sandboxApp.schema).toEqual(schemaBody.schema);
    await amplifyPullSandbox(projRoot, {
      appType: 'javascript',
      framework: 'angular',
      sandboxId: sandboxApp.backendManagerAppId,
    });
    await amplifyInitSandbox(projRoot, {});
    const projectSchema = getProjectSchema(projRoot, 'amplifyDatasource');
    expect(projectSchema).toEqual(schemaBody.schema);
    await amplifyPush(projRoot);
  });

  it('should init the project and create new env', async () => {
    await initJSProjectWithProfile(projRoot, {});
    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName } = meta;

    expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);

    // init new env
    await initNewEnvWithProfile(projRoot, { envName: 'foo' });
    const newEnvMeta = getProjectMeta(projRoot).providers.awscloudformation;

    const {
      AuthRoleName: newEnvAuthRoleName,
      UnauthRoleName: newEnvUnAuthRoleName,
      UnauthRoleArn: newEnvUnauthRoleArn,
      AuthRoleArn: newEnvAuthRoleArn,
      DeploymentBucketName: newEnvDeploymentBucketName,
    } = newEnvMeta;

    expect(newEnvAuthRoleName).not.toEqual(AuthRoleName);
    expect(UnauthRoleName).not.toEqual(newEnvUnAuthRoleName);
    expect(UnauthRoleArn).not.toEqual(newEnvUnauthRoleArn);
    expect(AuthRoleArn).not.toEqual(newEnvAuthRoleArn);
    expect(DeploymentBucketName).not.toEqual(newEnvDeploymentBucketName);

    expect(newEnvUnAuthRoleName).toBeIAMRoleWithArn(newEnvUnauthRoleArn);
    expect(newEnvAuthRoleName).toBeIAMRoleWithArn(newEnvAuthRoleArn);
    expect(newEnvDeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);
  });

  it('should init project without profile', async () => {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = getEnvVars();
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error('Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY either in .env file or as Environment variable');
    }
    await initProjectWithAccessKey(projRoot, {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    });

    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName } = meta;

    expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);

    // init new env
    await initNewEnvWithAccessKey(projRoot, {
      envName: 'foo',
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    });
    const newEnvMeta = getProjectMeta(projRoot).providers.awscloudformation;

    const {
      AuthRoleName: newEnvAuthRoleName,
      UnauthRoleName: newEnvUnAuthRoleName,
      UnauthRoleArn: newEnvUnauthRoleArn,
      AuthRoleArn: newEnvAuthRoleArn,
      DeploymentBucketName: newEnvDeploymentBucketName,
    } = newEnvMeta;

    expect(newEnvAuthRoleName).not.toEqual(AuthRoleName);
    expect(UnauthRoleName).not.toEqual(newEnvUnAuthRoleName);
    expect(UnauthRoleArn).not.toEqual(newEnvUnauthRoleArn);
    expect(AuthRoleArn).not.toEqual(newEnvAuthRoleArn);
    expect(DeploymentBucketName).not.toEqual(newEnvDeploymentBucketName);

    expect(newEnvUnAuthRoleName).toBeIAMRoleWithArn(newEnvUnauthRoleArn);
    expect(newEnvAuthRoleName).toBeIAMRoleWithArn(newEnvAuthRoleArn);
    expect(newEnvDeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);
  });

  it('init the project simulate checked in local-env-info with wrong path', async () => {
    await initJSProjectWithProfile(projRoot, {});

    // update <projRoot>/amplify/.config/local-env-info.json with nonexisting project path
    const localEnvPath = path.join(projRoot, 'amplify', '.config', 'local-env-info.json');
    expect(fs.existsSync(localEnvPath)).toBe(true);

    const localEnvData = fs.readJsonSync(localEnvPath);
    const originalPath = localEnvData.projectPath;

    expect(localEnvData.projectPath).toEqual(fs.realpathSync(projRoot));

    localEnvData.projectPath = path.join('foo', 'bar');

    fs.writeFileSync(localEnvPath, JSON.stringify(localEnvData, null, 2));

    // execute amplify status, which involves feature flags initialization, it must succeed
    await amplifyStatus(projRoot, 'Current Environment');

    // write back original path to make delete succeed in cleanup
    localEnvData.projectPath = originalPath;

    fs.writeFileSync(localEnvPath, JSON.stringify(localEnvData, null, 2));
  });

  it.only('should init the project and override root and push', async () => {
    await initJSProjectWithProfile(projRoot, {});
    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();
    const { AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName } = meta;

    expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
    expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
    expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);

    // override new env
    await amplifyOverrideRoot(projRoot, { testingWithLatestCodebase: true });
    const srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-root.ts');
    const destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'awscloudformation', 'override.ts');
    fs.copyFileSync(srcOverrideFilePath, destOverrideFilePath);
    await amplifyPushOverride(projRoot);
    const newEnvMeta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(newEnvMeta.AuthRoleName).toContain('mockRole');

    // create a new env, and the override should remain in place
    await addEnvironment(projRoot, { envName: 'envb' });
    const newestEnvMeta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(newestEnvMeta.AuthRoleName).toContain('mockRole');
  });
});
