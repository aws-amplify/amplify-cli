import path from 'node:path';
import assert from 'node:assert';
import { createNewProjectDir, npmInstall, deleteS3Bucket } from '@aws-amplify/amplify-e2e-core';
import { assertDefaultGen1Setup } from '../assertions';
import { setupAndPushDefaultGen1Project, runCodegenCommand, runGen2SandboxCommand, cleanupProjects } from '..';
import { copyFunctionFile } from '../function_utils';
import { copyGen1Schema } from '../api_utils';
import { updatePackageDependency } from '../updatePackageJson';
import { createS3Bucket } from '../sdk_calls';
import { runTemplategenCommand, stackRefactor } from '../templategen';

void describe('Templategen E2E tests', () => {
  void describe('Full Migration Templategen Flow', () => {
    let projRoot: string;
    let projName: string;
    let bucketName: string;

    beforeEach(async () => {
      const baseDir = process.env.INIT_CWD ?? process.cwd();
      projRoot = await createNewProjectDir('templategen_e2e_flow_test', path.join(baseDir, '..', '..'));
      projName = `test${Math.floor(Math.random() * 1000000)}`;
      bucketName = `testbucket${Math.floor(Math.random() * 1000000)}`;
    });

    afterEach(async () => {
      await cleanupProjects(projRoot);
      await deleteS3Bucket(bucketName);
    });

    void it('should init a project & add auth, function, storage, api with defaults & perform full migration templategen flow', async () => {
      await setupAndPushDefaultGen1Project(projRoot, projName);
      const { gen1StackName, gen1FunctionName, gen1Region } = await assertDefaultGen1Setup(projRoot);
      await createS3Bucket(bucketName, gen1Region);
      assert(gen1StackName);
      await runCodegenCommand(projRoot);
      await copyFunctionFile(projRoot, 'function', gen1FunctionName);
      await copyGen1Schema(projRoot, projName);

      // TODO: replace below line with correct package version
      await updatePackageDependency(projRoot, '@aws-amplify/backend');

      await npmInstall(projRoot);
      const gen2StackName = await runGen2SandboxCommand(projRoot);
      assert(gen2StackName);
      await runTemplategenCommand(projRoot, gen1StackName, gen2StackName);
      await stackRefactor(projRoot, 'auth', bucketName);
      await stackRefactor(projRoot, 'storage', bucketName);
    });
  });
});
