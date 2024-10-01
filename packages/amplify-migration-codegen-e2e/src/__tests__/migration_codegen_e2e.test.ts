import path from 'node:path';
import assert from 'node:assert';
import { createNewProjectDir } from '@aws-amplify/amplify-e2e-core';
import {
  cleanupProjects,
  setupAndPushGen1Project,
  assertGen1Setup,
  runCodegenCommand,
  runGen2SandboxCommand,
  assertUserPoolResource,
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

  void it('performs full migration codegen flow with Auth backend', async () => {
    await setupAndPushGen1Project(projRoot, 'CodegenTest');
    const { gen1UserPoolId, gen1Region } = await assertGen1Setup(projRoot);
    await assert.doesNotReject(runCodegenCommand(projRoot), 'Codegen failed');
    await assert.doesNotReject(runGen2SandboxCommand(projRoot), 'Gen2 CDK deployment failed');
    await assertUserPoolResource(projRoot, gen1UserPoolId, gen1Region);
  });
});
