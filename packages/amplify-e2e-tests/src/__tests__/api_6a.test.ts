import {
  createNewProjectDir,
  initJSProjectWithProfile,
  addApiWithoutSchema,
  amplifyPush,
  deleteProject,
  deleteProjectDir,
  putItemInTable,
  scanTable,
  rebuildApi,
  getProjectMeta,
} from 'amplify-e2e-core';

const projName = 'apitest';
let projRoot;
beforeEach(async () => {
  projRoot = await createNewProjectDir(projName);
  await initJSProjectWithProfile(projRoot, { name: projName });
  await addApiWithoutSchema(projRoot, { transformerVersion: 2 });
  await amplifyPush(projRoot);
});
afterEach(async () => {
  await deleteProject(projRoot);
  deleteProjectDir(projRoot);
});

describe('amplify rebuild api', () => {
  it('recreates all model tables', async () => {
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
