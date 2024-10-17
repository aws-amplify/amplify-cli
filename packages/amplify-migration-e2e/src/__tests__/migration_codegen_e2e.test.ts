import path from 'node:path';
import assert from 'node:assert';
import { createNewProjectDir, npmInstall } from '@aws-amplify/amplify-e2e-core';
import { createGen2Renderer } from '@aws-amplify/amplify-gen2-codegen';
import { copyFunctionFile } from '../function_utils';
import { copyGen1Schema } from '../api_utils';
import {
  cleanupProjects,
  setupAndPushDefaultGen1Project,
  setupAndPushAuthWithMaxOptionsGen1Project,
  setupAndPushStorageWithMaxOptionsGen1Project,
  runCodegenCommand,
  runGen2SandboxCommand,
} from '..';
import {
  assertStorageWithMaxOptionsGen1Setup,
  assertAuthWithMaxOptionsGen1Setup,
  assertDefaultGen1Setup,
  assertUserPoolResource,
  assertStorageResource,
  assertFunctionResource,
  assertDataResource,
  assertIdentityPoolResource,
  assertUserPoolClientsResource,
} from '../assertions';
import { removeErrorThrowsFromAuthResourceFile } from '../auth_utils';
import { updatePackageDependency } from '../updatePackageJson';
import { toggleSandboxSecrets } from '../secrets';

void describe('Codegen E2E tests', () => {
  void describe('render pipeline', () => {
    void it('renders a project with no parameters', async () => {
      const pipeline = createGen2Renderer({
        outputDir: path.join(process.env.INIT_CWD ?? './', 'output'),
        auth: {
          loginOptions: {
            email: true,
          },
        },
      });
      await assert.doesNotReject(pipeline.render);
    });
  });
  void describe('Full Migration Codegen Flow', () => {
    let projRoot: string;
    let projName: string;

    beforeEach(async () => {
      const baseDir = process.env.INIT_CWD ?? process.cwd();
      projRoot = await createNewProjectDir('codegen_e2e_flow_test', path.join(baseDir, '..', '..'));
      projName = `test${Math.floor(Math.random() * 1000000)}`;
    });

    afterEach(async () => {
      await cleanupProjects(projRoot);
    });

    void it('should init a project & add auth, function, storage, api with defaults & perform full migration codegen flow', async () => {
      await setupAndPushDefaultGen1Project(projRoot, projName);
      const { gen1UserPoolId, gen1ClientIds, gen1IdentityPoolId, gen1FunctionName, gen1BucketName, gen1GraphqlApiId, gen1Region } =
        await assertDefaultGen1Setup(projRoot);
      await runCodegenCommand(projRoot);
      await copyFunctionFile(projRoot, 'function', gen1FunctionName);
      await copyGen1Schema(projRoot, projName);
      await updatePackageDependency(projRoot, '@aws-amplify/backend', '0.0.0-test-20241003180022');
      await npmInstall(projRoot);
      const gen2StackName = await runGen2SandboxCommand(projRoot);
      await assertUserPoolResource(projRoot, gen1UserPoolId, gen1Region);
      await assertUserPoolClientsResource(projRoot, gen1UserPoolId, gen1ClientIds, gen1Region);
      await assertStorageResource(projRoot, gen1BucketName, gen1Region);
      await assertFunctionResource(projRoot, gen2StackName, gen1FunctionName, gen1Region);
      await assertIdentityPoolResource(projRoot, gen1IdentityPoolId, gen1Region);
      await assertDataResource(projRoot, gen2StackName, gen1GraphqlApiId, gen1Region);
    });

    void it('should init a project where all possible auth options are selected and perform full migration codegen flow ', async () => {
      await setupAndPushAuthWithMaxOptionsGen1Project(projRoot, projName);
      const { gen1UserPoolId, gen1ClientIds, gen1IdentityPoolId, gen1FunctionName, gen1Region } = await assertAuthWithMaxOptionsGen1Setup(
        projRoot,
      );
      await runCodegenCommand(projRoot);
      await copyFunctionFile(projRoot, 'auth', gen1FunctionName);
      await removeErrorThrowsFromAuthResourceFile(projRoot);
      await updatePackageDependency(projRoot, '@aws-amplify/backend', '0.0.0-test-20241003180022');
      await npmInstall(projRoot);
      await toggleSandboxSecrets(projRoot, 'set');
      const gen2StackName = await runGen2SandboxCommand(projRoot);
      await toggleSandboxSecrets(projRoot, 'remove');
      await assertUserPoolResource(projRoot, gen1UserPoolId, gen1Region, 'maxAuthOptions');
      await assertUserPoolClientsResource(projRoot, gen1UserPoolId, gen1ClientIds, gen1Region);
      await assertIdentityPoolResource(projRoot, gen1IdentityPoolId, gen1Region);
      await assertFunctionResource(projRoot, gen2StackName, gen1FunctionName, gen1Region);
    });

    void it('should init a project where default auth, all possible s3 bucket resource options are selected and perform full migration codegen flow ', async () => {
      await setupAndPushStorageWithMaxOptionsGen1Project(projRoot, projName);
      const { gen1UserPoolId, gen1ClientIds, gen1BucketName, gen1IdentityPoolId, gen1Region } = await assertStorageWithMaxOptionsGen1Setup(
        projRoot,
      );
      await runCodegenCommand(projRoot);
      await updatePackageDependency(projRoot, '@aws-amplify/backend', '0.0.0-test-20241003180022');
      await npmInstall(projRoot);
      await runGen2SandboxCommand(projRoot);
      await assertUserPoolResource(projRoot, gen1UserPoolId, gen1Region);
      await assertUserPoolClientsResource(projRoot, gen1UserPoolId, gen1ClientIds, gen1Region);
      await assertStorageResource(projRoot, gen1BucketName, gen1Region, 'maxStorageOptions');
      await assertIdentityPoolResource(projRoot, gen1IdentityPoolId, gen1Region);
    });
  });
});
