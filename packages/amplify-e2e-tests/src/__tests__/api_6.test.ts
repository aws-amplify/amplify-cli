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
  updateApiSchema,
  amplifyPushDestructiveApiUpdate,
  addFunction,
  amplifyPushAuth,
} from 'amplify-e2e-core';

const projName = 'apitest';
let projRoot;
beforeEach(async () => {
  projRoot = await createNewProjectDir(projName);
  await initJSProjectWithProfile(projRoot, { name: projName });
  await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
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

describe('destructive updates flag', () => {
  it('blocks destructive updates when flag not present', async () => {
    updateApiSchema(projRoot, projName, 'simple_model_new_primary_key.graphql');
    await amplifyPushDestructiveApiUpdate(projRoot, false);
    // success indicates that the command errored out
  });

  it('allows destructive updates when flag present', async () => {
    updateApiSchema(projRoot, projName, 'simple_model_new_primary_key.graphql');
    await amplifyPushDestructiveApiUpdate(projRoot, true);
    // success indicates that the push completed
  });

  it('disconnects and reconnects functions dependent on replaced table', async () => {
    const functionName = 'funcTableDep';
    await addFunction(
      projRoot,
      {
        name: functionName,
        functionTemplate: 'Hello World',
        additionalPermissions: {
          permissions: ['storage'],
          choices: ['api', 'storage'],
          resources: ['Todo:@model(appsync)'],
          operations: ['create', 'read', 'update', 'delete'],
        },
      },
      'nodejs',
    );
    await amplifyPushAuth(projRoot);
    updateApiSchema(projRoot, projName, 'simple_model_new_primary_key.graphql');
    await amplifyPushDestructiveApiUpdate(projRoot, false);
    // success indicates that the push completed
  });
});
