import path from 'node:path';
import assert from 'node:assert';
import { createNewProjectDir, generateRandomShortId, getSocialProviders, npmInstall } from '@aws-amplify/amplify-e2e-core';
import { createGen2Renderer } from '@aws-amplify/amplify-gen2-codegen';
import { copyFunctionFile, removeErrorThrowsFromFunctionFile } from '../function_utils';
import {
  cleanupProjects,
  setupAndPushDefaultGen1Project,
  setupAndPushAuthWithMaxOptionsGen1Project,
  setupAndPushStorageWithMaxOptionsGen1Project,
  runCodegenCommand,
  runGen2SandboxCommand,
  extractFunctionResourceName,
  updateAmplifyBackendPackagesVersion,
} from '..';
import {
  assertStorageWithMaxOptionsGen1Setup,
  assertAuthWithMaxOptionsGen1Setup,
  assertDefaultGen1Setup,
  assertAuthResource,
  assertStorageResource,
  assertFunctionResource,
  assertDataResource,
} from '../assertions';
import { removeErrorThrowsFromAuthResourceFile } from '../auth_utils';
import { toggleSandboxSecrets } from '../secrets';

void describe('Gen 2 Codegen E2E tests', () => {
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
  void describe('Full Migration Gen 2 Codegen Flow', () => {
    let projRoot: string;
    let projName: string;

    beforeEach(async () => {
      const baseDir = process.env.INIT_CWD ?? process.cwd();
      projRoot = await createNewProjectDir('codegen_e2e_flow_test', path.join(baseDir, '..', '..'));
      projName = `test${generateRandomShortId()}`;
    });

    afterEach(async () => {
      await cleanupProjects(projRoot, projName);
    });

    void it('should init a project & add auth, function, storage, api with defaults & perform full migration codegen flow', async () => {
      // Arrange
      await setupAndPushDefaultGen1Project(projRoot, projName);

      // Act
      const { gen1UserPoolId, gen1ClientIds, gen1IdentityPoolId, gen1FunctionName, gen1BucketName, gen1GraphqlApiId, gen1Region, envName } =
        await assertDefaultGen1Setup(projRoot);
      runCodegenCommand(projRoot);
      copyFunctionFile(projRoot, 'function', gen1FunctionName);
      removeErrorThrowsFromFunctionFile(projRoot, 'function', extractFunctionResourceName(gen1FunctionName, envName));
      updateAmplifyBackendPackagesVersion(projRoot);
      npmInstall(projRoot);
      const gen2StackName = await runGen2SandboxCommand(projRoot, projName);

      // Assert
      await assertAuthResource(projRoot, gen1UserPoolId, gen1ClientIds, gen1IdentityPoolId, gen1Region);
      await assertStorageResource(projRoot, gen1BucketName, gen1Region);
      await assertFunctionResource(projRoot, gen2StackName, gen1FunctionName, gen1Region);
      await assertDataResource(projRoot, gen2StackName, gen1GraphqlApiId, gen1Region);
    });

    void it('should init a project where all possible auth options are selected and perform full migration codegen flow ', async () => {
      // Arrange
      const socialProviders = getSocialProviders();
      Object.entries(socialProviders).forEach(([socialProvider, value]) => {
        // we expect APPLE_PRIVATE_KEY_2 in process.env but getSocialProviders returns as APPLE_PRIVATE_KEY
        if (socialProvider === 'APPLE_PRIVATE_KEY') {
          socialProvider = 'APPLE_PRIVATE_KEY_2';
        }
        process.env[socialProvider] = process.env[socialProvider] ?? value;
      });
      await setupAndPushAuthWithMaxOptionsGen1Project(projRoot, projName);

      // Act
      const { gen1UserPoolId, gen1ClientIds, gen1IdentityPoolId, gen1FunctionName, gen1Region } = await assertAuthWithMaxOptionsGen1Setup(
        projRoot,
      );
      runCodegenCommand(projRoot);
      copyFunctionFile(projRoot, 'auth', gen1FunctionName);
      removeErrorThrowsFromAuthResourceFile(projRoot);
      updateAmplifyBackendPackagesVersion(projRoot);
      npmInstall(projRoot);
      await toggleSandboxSecrets(projRoot, projName, 'set');
      const gen2StackName = await runGen2SandboxCommand(projRoot, projName);
      await toggleSandboxSecrets(projRoot, projName, 'remove');

      // Assert
      await assertAuthResource(projRoot, gen1UserPoolId, gen1ClientIds, gen1IdentityPoolId, gen1Region);
      await assertFunctionResource(projRoot, gen2StackName, gen1FunctionName, gen1Region);
    });

    void it('should init a project where default auth, all possible s3 bucket resource options are selected and perform full migration codegen flow ', async () => {
      // Arrange
      await setupAndPushStorageWithMaxOptionsGen1Project(projRoot, projName);

      // Act
      const { gen1UserPoolId, gen1ClientIds, gen1BucketName, gen1IdentityPoolId, gen1Region, gen1FunctionName, envName } =
        await assertStorageWithMaxOptionsGen1Setup(projRoot);
      runCodegenCommand(projRoot);
      updateAmplifyBackendPackagesVersion(projRoot);
      npmInstall(projRoot);
      removeErrorThrowsFromFunctionFile(projRoot, 'storage', extractFunctionResourceName(gen1FunctionName, envName));
      await runGen2SandboxCommand(projRoot, projName);

      // Assert
      await assertAuthResource(projRoot, gen1UserPoolId, gen1ClientIds, gen1IdentityPoolId, gen1Region);
      await assertStorageResource(projRoot, gen1BucketName, gen1Region);
    });
  });
});
