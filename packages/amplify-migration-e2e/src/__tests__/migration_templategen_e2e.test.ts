import path from 'node:path';
import assert from 'node:assert';
import { createNewProjectDir, npmInstall, generateRandomShortId } from '@aws-amplify/amplify-e2e-core';
import { assertDefaultGen1Setup } from '../assertions';
import {
  setupAndPushDefaultGen1Project,
  runCodegenCommand,
  runGen2SandboxCommand,
  cleanupProjects,
  extractFunctionResourceName,
  updateAmplifyBackendPackagesVersion,
} from '..';
import { copyFunctionFile, removeErrorThrowsFromFunctionFile } from '../function_utils';
import { assertExecuteCommand, RefactorCategory, runExecuteCommand, runGen2DeployPostExecute, runRevertCommand } from '../templategen';

const CATEGORIES_TO_MOVE: RefactorCategory[] = ['auth', 'storage'];

void describe('Templategen E2E tests', () => {
  void describe('Full Migration Templategen Flow', () => {
    let projRoot: string;
    let projName: string;

    beforeEach(async () => {
      const baseDir = process.env.INIT_CWD ?? process.cwd();
      projRoot = await createNewProjectDir('templategen_e2e_flow_test', path.join(baseDir, '..', '..'));
      projName = `test${generateRandomShortId()}`;
    });

    afterEach(async () => {
      await cleanupProjects(projRoot, projName);
    });

    void it('should init a project & add auth, function, storage, api with defaults & perform refactor', async () => {
      // Arrange
      await setupAndPushDefaultGen1Project(projRoot, projName);

      // Act
      const { gen1StackName, gen1FunctionName, envName } = await assertDefaultGen1Setup(projRoot);
      assert(gen1StackName);
      runCodegenCommand(projRoot);
      copyFunctionFile(projRoot, 'function', gen1FunctionName);
      removeErrorThrowsFromFunctionFile(projRoot, 'function', extractFunctionResourceName(gen1FunctionName, envName));
      updateAmplifyBackendPackagesVersion(projRoot);
      npmInstall(projRoot);
      // Below env is only needed for CI/CD deployments and is expected to be set by customers for their app
      // To emulate the migration in sandbox, we set it explicitly.
      process.env.AMPLIFY_GEN_1_ENV_NAME = envName;
      const gen2StackName = await runGen2SandboxCommand(projRoot, projName);
      assert(gen2StackName);

      runExecuteCommand(projRoot, gen1StackName, gen2StackName);
      await runGen2DeployPostExecute(projRoot, projName, envName, CATEGORIES_TO_MOVE);

      // Assert
      await assertExecuteCommand(projRoot, CATEGORIES_TO_MOVE);

      runRevertCommand(projRoot, gen1StackName, gen2StackName);
    });
  });
});
