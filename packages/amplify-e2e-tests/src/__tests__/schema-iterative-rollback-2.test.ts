import * as path from 'path';
import {
  createNewProjectDir,
  initJSProjectWithProfile,
  deleteProject,
  deleteProjectDir,
  amplifyPushIterativeRollback,
  getDDBTable,
  getBackendAmplifyMeta,
  addApiWithSchema,
  addFeatureFlag,
  amplifyPush,
  updateApiSchema,
  getTableResourceId,
  getNestedStackID,
  cancelIterativeAmplifyPush,
} from 'amplify-e2e-core';

describe('Iterative Rollback - removing two @keys', () => {
  let projectDir: string;

  beforeAll(async () => {
    projectDir = await createNewProjectDir('iterativeRollback');
    await initJSProjectWithProfile(projectDir, {});
    addFeatureFlag(projectDir, 'graphqltransformer', 'enableiterativegsiupdates', true);
  });
  afterAll(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });
  it('should support rolling back from the 2nd deployment on adding gsis', async () => {
    const apiName = 'renamekey';
    const initialSchema = path.join('iterative-push', 'multiple-key-delete', 'initial-schema.graphql');
    await addApiWithSchema(projectDir, initialSchema, { apiName, apiKeyExpirationDays: 7 });
    await amplifyPush(projectDir);

    // get info on table
    const meta = getBackendAmplifyMeta(projectDir);
    const { StackId: stackId, Region: region } = meta.providers.awscloudformation;
    const { logicalId } = meta.api[apiName].providerMetadata;
    const apiID = await getNestedStackID(stackId, region, logicalId);
    const tableName = await getTableResourceId(region, 'Something', apiID);
    let table = await getDDBTable(tableName, region);

    expect(table.Table.GlobalSecondaryIndexes).toBeDefined();
    expect(table.Table.GlobalSecondaryIndexes.length).toEqual(2);

    const finalSchema = path.join('iterative-push', 'multiple-key-delete', 'final-schema.graphql');
    updateApiSchema(projectDir, apiName, finalSchema);
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
