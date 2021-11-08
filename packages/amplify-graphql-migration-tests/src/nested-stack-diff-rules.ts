import { ResourceImpact, TemplateDiff } from '@aws-cdk/cloudformation-diff';

export const getNestedStackDiffRules = (): NestedStackDiffRule[] => [
  onlyUpdatesTableNameProperty,
  tableNameResolvesToSameName,
  dataSourceLogicalIdsAreSame,
];

/**
 * The table name is not actually updated but the way it's defined is changed (tableNameResolvesToSameName will check the table name)
 * This check asserts that no other table properties were changed by the migration (GSIs, LSIs, etc)
 * @param stackName The name of the nested stack
 * @param diff The diff of the nested stack
 */
const onlyUpdatesTableNameProperty = (stackName: string, diff: TemplateDiff) => {
  const allowedPropertyUpdates = ['ProvisionedThroughput'];
  const propertyUpdates = Object.keys(diff.resources.changes[`${stackName}Table`].propertyUpdates).filter(
    prop => !allowedPropertyUpdates.includes(prop),
  );
  try {
    expect(propertyUpdates).toEqual(['TableName']); // The table name should resolve to the same value but the way it's defined is different so it shows up here as a diff
  } catch (err) {
    console.error(`Expected only TableName update for table ${stackName}Table. Instead got updates:`);
    console.log(JSON.stringify(propertyUpdates, undefined, 2));
    throw err;
  }
};

const tableNameResolvesToSameName = (stackName: string, diff: TemplateDiff) => {
  const propertyUpdates = diff.resources.changes[`${stackName}Table`].propertyUpdates;
  const newTableName = propertyUpdates.TableName.newValue;
  expect(newTableName['Fn::Join']).toBeDefined();
  const joinParams = newTableName['Fn::Join'];
  const joinStr = joinParams[0] as string;
  const joinElements = joinParams[1] as any[];

  const apiId = 'testApiId';
  const env = 'testEnv';

  const replacedElements = joinElements.map(el => {
    if (typeof el?.Ref === 'string') {
      if (el.Ref.startsWith('referencetotransformerrootstackGraphQLAPI')) {
        return apiId;
      }
      if (el.Ref.startsWith('referencetotransformerrootstackenv')) {
        return env;
      }
    }
    return el;
  });
  const finalTableName = replacedElements.join(joinStr);
  expect(finalTableName).toEqual(`${stackName}-${apiId}-${env}`);
};

const dataSourceLogicalIdsAreSame = (_: string, diff: TemplateDiff) => {
  const areDataSourcesReplaced = Object.values(diff.resources.changes)
    .filter(diff => diff.resourceType === 'AWS::AppSync::DataSource')
    .map(diff => diff.changeImpact === ResourceImpact.WILL_REPLACE)
    .reduce((acc, it) => acc && it, true);
  expect(areDataSourcesReplaced).toBe(true);
};

export type NestedStackDiffRule = (stackName: string, diff: TemplateDiff) => void;
