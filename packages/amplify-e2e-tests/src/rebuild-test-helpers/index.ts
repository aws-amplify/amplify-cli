import { putItemInTable, scanTable } from "@aws-amplify/amplify-e2e-core";

export const testTableBeforeRebuildApi = async (apiId: string, region: string, modelName: string) => {
  const tableName = `${modelName}-${apiId}-integtest`;
  await putItemInTable(tableName, region, { id: 'this is a test value' });
  const scanResultBefore = await scanTable(tableName, region);
  expect(scanResultBefore.Items.length).toBe(1);
};

export const testTableAfterRebuildApi = async (apiId: string, region: string, modelName: string) => {
  const tableName = `${modelName}-${apiId}-integtest`;
  const scanResultAfter = await scanTable(tableName, region);
  expect(scanResultAfter.Items.length).toBe(0);
};