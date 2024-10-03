import path from 'node:path';
import assert from 'node:assert';
import { createNewProjectDir, sleep } from '@aws-amplify/amplify-e2e-core';
import {
  cleanupProjects,
  setupAndPushGen1Project,
  assertGen1Setup,
  runCodegenCommand,
  runGen2SandboxCommand,
  assertUserPoolResource,
  assertStorageResource,
  assertFunctionResource,
  copyTsFile,
} from '../helpers';

void describe('Migration Codegen E2E tests', () => {
  let projRoot: string;
  beforeEach(async () => {
    const baseDir = process.env.INIT_CWD ?? process.cwd();
    projRoot = await createNewProjectDir('codegen_e2e_flow_test', path.join(baseDir, '..', '..'));
  });

  afterEach(async () => {
    await cleanupProjects(projRoot);
  });

  void it('performs full migration codegen flow with backend', async () => {
    await setupAndPushGen1Project(projRoot, 'CodegenTest');
    const { gen1UserPoolId, gen1FunctionName, gen1BucketName, gen1Region } = await assertGen1Setup(projRoot);
    await assert.doesNotReject(runCodegenCommand(projRoot), 'Codegen failed');
    await sleep(10000); // 10 seconds
    const gen1FunctionPath = path.join(
      projRoot,
      '.amplify',
      'migration',
      'amplify',
      'backend',
      'function',
      gen1FunctionName.split('-')[0],
      'src',
      'index.js',
    );
    const gen2FunctionPath = path.join(projRoot, 'amplify', 'function', gen1FunctionName.split('-')[0], 'handler.ts');
    await copyTsFile(gen1FunctionPath, gen2FunctionPath);
    await assert.doesNotReject(runGen2SandboxCommand(projRoot), 'Gen2 CDK deployment failed');
    await assertUserPoolResource(projRoot, gen1UserPoolId, gen1Region);
    await assertStorageResource(projRoot, gen1BucketName, gen1Region);
    await assertFunctionResource(projRoot, gen1FunctionName, gen1Region);
  });
});
