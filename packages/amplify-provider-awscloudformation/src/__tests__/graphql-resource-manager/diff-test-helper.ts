import * as gsiTestHelper from './gsi-test-helpers';
import { diff as getDiffs } from 'deep-diff';
import { DynamoDB } from 'cloudform';
import { DiffableProject } from '../../graphql-resource-manager/utils';

export const getDiffedProject = (
  currentGSI: gsiTestHelper.GSIDefinition[] | undefined,
  nextGSI: gsiTestHelper.GSIDefinition[] | undefined,
) => {
  const table1 = gsiTestHelper.makeTableWithGSI({
    gsis: currentGSI,
  });
  const table2 = gsiTestHelper.makeTableWithGSI({
    gsis: nextGSI,
  });

  const currentProj = makeProj('Post', table1);
  const nextProj = makeProj('Post', table2);

  const diffedValue = getDiffs(currentProj, nextProj);
  return { current: currentProj, next: nextProj, diff: diffedValue };
};

export const makeProj = (stackName: string, table: DynamoDB.Table): DiffableProject => {
  return {
    root: {},
    stacks: {
      [stackName]: {
        Resources: {
          [`${table.Properties.TableName || 'MyTable'}Table`]: table,
        },
      },
    },
  };
};
