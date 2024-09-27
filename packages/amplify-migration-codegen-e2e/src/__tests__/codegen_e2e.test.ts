import path from 'node:path';
import { createNewProjectDir } from '@aws-amplify/amplify-e2e-core';
import { cleanupProjects, setupGen1Project, assertGen1Setup, migrateCodegen, deployGen2Project, assertGen2Resources } from '../helpers';

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
    await setupGen1Project(projRoot, 'CodegenTest');
    const { gen1UserPoolId, gen1Region } = await assertGen1Setup(projRoot);
    await migrateCodegen(projRoot);
    await deployGen2Project(projRoot);
    await assertGen2Resources(projRoot, gen1UserPoolId, gen1Region);
  });
});
