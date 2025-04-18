import path from 'node:path';
import assert from 'node:assert';
import { createNewProjectDir, npmInstall, deleteS3Bucket, generateRandomShortId } from '@aws-amplify/amplify-e2e-core';
import { assertDefaultGen1Setup } from '../assertions';
import { setupAndPushDefaultGen1Project, runCodegenCommand, runGen2SandboxCommand, cleanupProjects } from '..';
import { copyFunctionFile } from '../function_utils';
import { copyGen1Schema } from '../api_utils';
import { createS3Bucket } from '../sdk_calls';
import { runExecuteCommand, runRevertCommand } from '../templategen';

void describe('Templategen E2E tests', () => {
  void describe('Full Migration Templategen Flow', () => {
    let projRoot: string;
    let projName: string;
    let bucketName: string;

    beforeEach(async () => {
      const baseDir = process.env.INIT_CWD ?? process.cwd();
      projRoot = await createNewProjectDir('templategen_e2e_flow_test', path.join(baseDir, '..', '..'));
      projName = `test${generateRandomShortId()}`;
      bucketName = `testbucket${generateRandomShortId()}`;
    });

    afterEach(async () => {
      await cleanupProjects(projRoot, projName);
      await deleteS3Bucket(bucketName);
    });

    void it('should init a project & add auth, function, storage, api with defaults & perform refactor', async () => {
      await setupAndPushDefaultGen1Project(projRoot, projName);
      const { gen1StackName, gen1FunctionName } = await assertDefaultGen1Setup(projRoot);
      assert(gen1StackName);
      runCodegenCommand(projRoot);
      copyFunctionFile(projRoot, 'function', gen1FunctionName);
      copyGen1Schema(projRoot, projName);
      npmInstall(projRoot);
      const gen2StackName = await runGen2SandboxCommand(projRoot, projName);
      assert(gen2StackName);
      runExecuteCommand(projRoot, gen1StackName, gen2StackName);
    });

    void it('should init a project & add auth, function, storage, api with defaults, perform refactor and revert to the original state', async () => {
      await setupAndPushDefaultGen1Project(projRoot, projName);
      const { gen1StackName, gen1FunctionName, gen1Region } = await assertDefaultGen1Setup(projRoot);
      await createS3Bucket(bucketName, gen1Region);
      assert(gen1StackName);
      runCodegenCommand(projRoot);
      copyFunctionFile(projRoot, 'function', gen1FunctionName);
      copyGen1Schema(projRoot, projName);
      npmInstall(projRoot);
      const gen2StackName = await runGen2SandboxCommand(projRoot, projName);
      assert(gen2StackName);
      runExecuteCommand(projRoot, gen1StackName, gen2StackName);
      runRevertCommand(projRoot, gen1StackName, gen2StackName);
    });
  });
});
