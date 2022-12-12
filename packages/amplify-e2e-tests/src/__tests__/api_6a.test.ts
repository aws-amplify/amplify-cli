import {
  createNewProjectDir,
  initJSProjectWithProfile,
  addApiWithoutSchema,
  amplifyPush,
  deleteProject,
  deleteProjectDir,
  rebuildApi,
  getProjectMeta,
  updateApiSchema,
} from '@aws-amplify/amplify-e2e-core';
import { testTableAfterRebuildApi, testTableBeforeRebuildApi } from '../rebuild-test-helpers';

const projName = 'apitest';

let projRoot;
beforeEach(async () => {
  projRoot = await createNewProjectDir(projName);
});
afterEach(async () => {
  await deleteProject(projRoot);
  deleteProjectDir(projRoot);
});

describe('amplify rebuild api', () => {
  it('recreates single table', async () => {
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApiWithoutSchema(projRoot, { transformerVersion: 2 });
    await amplifyPush(projRoot);
    const projMeta = getProjectMeta(projRoot);
    const apiId = projMeta?.api?.[projName]?.output?.GraphQLAPIIdOutput;
    const region = projMeta?.providers?.awscloudformation?.Region;
    expect(apiId).toBeDefined();
    expect(region).toBeDefined();
    await testTableBeforeRebuildApi(apiId, region, 'Todo');
    await rebuildApi(projRoot, projName);
    await testTableAfterRebuildApi(apiId, region, 'Todo');
  });
  it('recreates tables for relational models', async () => {
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApiWithoutSchema(projRoot, { transformerVersion: 2 });
    await updateApiSchema(projRoot, projName, 'relational_models_v2.graphql');
    await amplifyPush(projRoot);
    const projMeta = getProjectMeta(projRoot);
    const apiId = projMeta?.api?.[projName]?.output?.GraphQLAPIIdOutput;
    const region = projMeta?.providers?.awscloudformation?.Region;
    expect(apiId).toBeDefined();
    expect(region).toBeDefined();

    const modelNames = [ 'Todo', 'Task', 'Worker' ];
    modelNames.forEach(async (modelName) => await testTableBeforeRebuildApi(apiId, region, modelName));
    await rebuildApi(projRoot, projName);
    modelNames.forEach(async (modelName) => await testTableAfterRebuildApi(apiId, region, modelName));
  });
});
