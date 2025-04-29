import assert from 'node:assert';
import { DataTableMapping } from '@aws-amplify/amplify-gen2-codegen';
import { Stack } from '@aws-sdk/client-cloudformation';

export const tableMappingKey = 'DataSourceMappingOutput';

export const getDataDefinition = (dataStack: Stack): DataTableMapping => {
  const rawTableMapping = dataStack.Outputs?.find((o) => o.OutputKey === tableMappingKey)?.OutputValue;
  assert(rawTableMapping);
  const tableMapping = JSON.parse(rawTableMapping);
  return tableMapping;
};
