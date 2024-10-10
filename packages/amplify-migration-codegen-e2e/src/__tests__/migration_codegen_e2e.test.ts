import path from 'node:path';
import assert from 'node:assert';
import { createNewProjectDir } from '@aws-amplify/amplify-e2e-core';
import { createGen2Renderer } from '@aws-amplify/amplify-gen2-codegen';
import { copyFunctionFile } from '../function_utils';
import { copyGen1Schema } from '../api-utils';
import { cleanupProjects, setupAndPushGen1Project, runCodegenCommand, runGen2SandboxCommand } from '..';
import { assertGen1Setup, assertUserPoolResource, assertStorageResource, assertFunctionResource, assertDataResource } from '../assertions';

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
      await setupAndPushGen1Project(projRoot, projName);
      const { gen1UserPoolId, gen1FunctionName, gen1BucketName, gen1GraphqlApiId, gen1Region } = await assertGen1Setup(projRoot);
      await runCodegenCommand(projRoot);
      await copyFunctionFile(projRoot, gen1FunctionName);
      await copyGen1Schema(projRoot, projName);
      const gen2StackName = await runGen2SandboxCommand(projRoot);
      await assertUserPoolResource(projRoot, gen1UserPoolId, gen1Region);
      await assertStorageResource(projRoot, gen1BucketName, gen1Region);
      await assertFunctionResource(projRoot, gen2StackName, gen1FunctionName, gen1Region);
      await assertDataResource(projRoot, gen2StackName, gen1GraphqlApiId, gen1Region);
    });
  });
});
