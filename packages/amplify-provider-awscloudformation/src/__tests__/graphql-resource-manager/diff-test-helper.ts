import { diff as getDiffs } from 'deep-diff';
import { DynamoDB } from 'cloudform-types';
import { $TSAny } from '@aws-amplify/amplify-cli-core';
import * as gsiTestHelper from './gsi-test-helpers';
import { DiffableProject } from '../../graphql-resource-manager/utils';

/**
 * Get a test Diffable project
 */
export const getDiffedProject = (
  currentGSI: gsiTestHelper.GSIDefinition[] | undefined,
  nextGSI: gsiTestHelper.GSIDefinition[] | undefined,
  addTableToRoot = false,
): $TSAny => {
  const table1 = gsiTestHelper.makeTableWithGSI({
    gsis: currentGSI,
  });
  const table2 = gsiTestHelper.makeTableWithGSI({
    gsis: nextGSI,
  });

  const currentProj = addTableToRoot ? makeProjWithTableOnRoot(table1) : makeProj('Post', table1);
  const nextProj = addTableToRoot ? makeProjWithTableOnRoot(table2) : makeProj('Post', table2);

  const diffedValue = getDiffs(currentProj, nextProj);
  return { current: currentProj, next: nextProj, diff: diffedValue };
};

/**
 *  Makes a project with given table on a child stack
 */
export const makeProj = (stackName: string, table: DynamoDB.Table): DiffableProject => ({
  root: {},
  stacks: {
    [stackName]: {
      Resources: {
        [`${table.Properties.TableName || 'MyTable'}Table`]: table,
      },
    },
  },
});

/**
 * Makes a project with given table on the root stack
 */
export const makeProjWithTableOnRoot = (table: DynamoDB.Table): DiffableProject => ({
  root: {
    Resources: {
      [`${table.Properties.TableName || 'MyTable'}Table`]: table,
    },
  },
  stacks: {},
});
