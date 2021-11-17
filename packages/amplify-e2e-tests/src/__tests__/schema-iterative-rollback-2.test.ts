import * as path from 'path';
import {
  createNewProjectDir,
  initJSProjectWithProfile,
  deleteProject,
  deleteProjectDir,
  amplifyPushIterativeRollback,
  getDDBTable,
  getBackendAmplifyMeta,
  addApiWithoutSchema,
  addFeatureFlag,
  amplifyPush,
  updateApiSchema,
  getTableResourceId,
  getNestedStackID,
  cancelIterativeAmplifyPush,
  createRandomName,
} from 'amplify-e2e-core';

describe('Iterative Rollback - removing two @keys', () => {
  let projectDir: string;
  let appName: string;

  beforeAll(async () => {
    appName = createRandomName();
    projectDir = await createNewProjectDir('iterativeRollback');
    await initJSProjectWithProfile(projectDir, {
      name: appName,
    });
    addFeatureFlag(projectDir, 'graphqltransformer', 'enableiterativegsiupdates', true);
  });
  afterAll(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });
  it('should support rolling back from the 2nd deployment on adding gsis', async () => {
    const initialSchema = path.join('iterative-push', 'multiple-key-delete', 'initial-schema.graphql');
    await addApiWithoutSchema(projectDir, { apiKeyExpirationDays: 7, transformerVersion: 1 });
    await updateApiSchema(projectDir, appName, initialSchema);
    await amplifyPush(projectDir);

    // get info on table
    const meta = getBackendAmplifyMeta(projectDir);
    const { StackId: stackId, Region: region } = meta.providers.awscloudformation;
    const { logicalId } = meta.api[appName].providerMetadata;
    const apiID = await getNestedStackID(stackId, region, logicalId);
    const tableName = await getTableResourceId(region, 'Something', apiID);
    let table = await getDDBTable(tableName, region);

    expect(table.Table.GlobalSecondaryIndexes).toBeDefined();
    expect(table.Table.GlobalSecondaryIndexes.length).toEqual(2);

    const finalSchema = path.join('iterative-push', 'multiple-key-delete', 'final-schema.graphql');
    updateApiSchema(projectDir, appName, finalSchema);
    // cancel iterative push on 2nd deployment
    await cancelIterativeAmplifyPush(projectDir, { current: 2, max: 3 });

    await new Promise(res => setTimeout(res, 1000));

    table = await getDDBTable(tableName, region);
    expect(table.Table.GlobalSecondaryIndexes).toBeDefined();
    expect(table.Table.GlobalSecondaryIndexes.length).toEqual(1);

    await amplifyPushIterativeRollback(projectDir);

    table = await getDDBTable(tableName, region);
    expect(table.Table.GlobalSecondaryIndexes).toBeDefined();
    expect(table.Table.GlobalSecondaryIndexes.length).toEqual(2);
  });
});
