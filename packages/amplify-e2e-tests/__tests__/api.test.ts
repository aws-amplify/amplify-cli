require('../src/aws-matchers/'); // custom matcher for assertion
import {
  initProjectWithProfile,
  deleteProject,
  amplifyPush,
  amplifyPushUpdate
} from '../src/init';
import * as path from 'path';
import { existsSync } from 'fs';
import { addApiWithSchema, updateApiSchema } from '../src/categories/api';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, updateConfig, getTable, deleteTable } from '../src/utils';

describe('amplify add api', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
    jest.setTimeout(1000 * 60 * 60); // 1 hour
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('init a project and add the simple_model api', async () => {
    await initProjectWithProfile(projRoot, { name: 'simplemodel' });
    await addApiWithSchema(projRoot, 'simple_model.graphql');
    await amplifyPush(projRoot);
    const { output } = getProjectMeta(projRoot).api.simplemodel;

    // TODO - Validate these using control plane API calls.
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;

    await expect(GraphQLAPIIdOutput).toBeDefined()
    await expect(GraphQLAPIEndpointOutput).toBeDefined()
    await expect(GraphQLAPIKeyOutput).toBeDefined()
  });

  it('inits a project with a simple model and then migrates the api', async () => {
    const projectName = 'blogapp';
    const initialSchema = 'initial_key_blog.graphql';
    const nextSchema = 'next_key_blog.graphql';
    await initProjectWithProfile(projRoot, { name: projectName });
    await addApiWithSchema(projRoot, initialSchema);
    await amplifyPush(projRoot);
    updateApiSchema(projRoot, projectName, nextSchema);
    await amplifyPushUpdate(projRoot);
    const { output } = getProjectMeta(projRoot).api[projectName];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;

    await expect(GraphQLAPIIdOutput).toBeDefined()
    await expect(GraphQLAPIEndpointOutput).toBeDefined()
    await expect(GraphQLAPIKeyOutput).toBeDefined()
  });

  // TODO: Disabling for now until further conversation.
  // it('inits a project with a simple model with deletion protection enabled and then migrates the api', async () => {
  //   const projectName = 'retaintables';
  //   const initialSchema = 'simple_model.graphql';
  //   console.log(projRoot);
  //   await initProjectWithProfile(projRoot, { name: projectName });
  //   await addApiWithSchema(projRoot, initialSchema);
  //   updateConfig(projRoot, projectName, {
  //     TransformerOptions: {
  //       '@model': { EnableDeletionProtection: true }
  //     }
  //   });
  //   await amplifyPush(projRoot);
  //   const projectMeta = getProjectMeta(projRoot);
  //   const region = projectMeta.providers.awscloudformation.Region;
  //   const { output } = projectMeta.api[projectName];
  //   const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
  //   await expect(GraphQLAPIIdOutput).toBeDefined()
  //   await expect(GraphQLAPIEndpointOutput).toBeDefined()
  //   await expect(GraphQLAPIKeyOutput).toBeDefined()
  //   await deleteProject(projRoot);
  //   const tableName = `Todo-${GraphQLAPIIdOutput}-integtest`;
  //   const table = await getTable(tableName, region);
  //   expect(table.Table).toBeDefined()
  //   if (table.Table) {
  //     const del = await deleteTable(tableName, region);
  //     expect(del.TableDescription).toBeDefined()
  //   }
  // });
});
