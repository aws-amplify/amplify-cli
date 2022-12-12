import {
  createNewProjectDir,
  initJSProjectWithProfile,
  addApiWithoutSchema,
  amplifyPush,
  deleteProjectDir,
  rebuildApi,
  getProjectMeta,
  updateApiSchema,
  amplifyDeleteWithLongerTimeout,
} from '@aws-amplify/amplify-e2e-core';
import { testTableAfterRebuildApi, testTableBeforeRebuildApi } from '../rebuild-test-helpers';

const projName = 'apitest';

let projRoot;
beforeEach(async () => {
  projRoot = await createNewProjectDir(projName);
});
afterEach(async () => {
  await amplifyDeleteWithLongerTimeout(projRoot);
  deleteProjectDir(projRoot);
});

describe('amplify rebuild api', () => {
  it('recreates tables for searchable models', async () => {
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApiWithoutSchema(projRoot, { transformerVersion: 2 });
    await updateApiSchema(projRoot, projName, 'searchable_model_v2.graphql');
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
});