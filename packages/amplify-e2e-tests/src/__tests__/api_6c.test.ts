import {
  createNewProjectDir,
  initJSProjectWithProfile,
  addApiWithoutSchema,
  amplifyPush,
  deleteProjectDir,
  putItemInTable,
  scanTable,
  rebuildApi,
  getProjectMeta,
  updateApiSchema,
  amplifyDeleteWithLongerTimeout,
} from '@aws-amplify/amplify-e2e-core';

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
  it('recreates tables and opensearch service for searchable models', async () => {
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApiWithoutSchema(projRoot, { transformerVersion: 2 });
    await updateApiSchema(projRoot, projName, 'searchable_model_v2.graphql');
    await amplifyPush(projRoot);
    const projMeta = getProjectMeta(projRoot);
    const apiId = projMeta?.api?.[projName]?.output?.GraphQLAPIIdOutput;
    const region = projMeta?.providers?.awscloudformation?.Region;
    expect(apiId).toBeDefined();
    expect(region).toBeDefined();
    const tableName = `Todo-${apiId}-integtest`;
    await putItemInTable(tableName, region, { id: 'this is a test value' });
    const scanResultBefore = await scanTable(tableName, region);
    expect(scanResultBefore.Items.length).toBe(1);
    await rebuildApi(projRoot, projName);
    const scanResultAfter = await scanTable(tableName, region);
    expect(scanResultAfter.Items.length).toBe(0);
  });
});