import * as fs from 'fs-extra';
import * as path from 'path';
import _ from 'lodash';
import { Template } from 'cloudform-types';
import { JSONUtilities } from 'amplify-cli-core';
import { diff as getDiffs, Diff as DeepDiff } from 'deep-diff';
import { readFromPath } from './fileUtils';
import { InvalidMigrationError, InvalidGSIMigrationError } from '../errors';
import { TRANSFORM_CONFIG_FILE_NAME } from '..';

type Diff = DeepDiff<DiffableProject, DiffableProject>;
export type DiffRule = (diff: Diff, currentBuild: DiffableProject, nextBuild: DiffableProject) => void;
export type ProjectRule = (diffs: Diff[], currentBuild: DiffableProject, nextBuild: DiffableProject) => void;

interface DiffableProject {
  stacks: {
    [stackName: string]: Template;
  };
  root: Template;
}

/**
 * Calculates a diff between the last saved cloud backend's build directory
 * and the most recent build.
 */
export const sanityCheckProject = async (
  currentCloudBackendDir: string,
  buildDirectory: string,
  rootStackName: string,
  diffRules: DiffRule[],
  projectRule: ProjectRule[],
): Promise<void> => {
  const cloudBackendDirectoryExists = fs.existsSync(currentCloudBackendDir);
  const buildDirectoryExists = fs.existsSync(buildDirectory);

  if (cloudBackendDirectoryExists && buildDirectoryExists) {
    const current = await loadDiffableProject(currentCloudBackendDir, rootStackName);
    const next = await loadDiffableProject(buildDirectory, rootStackName);
    const diffs = getDiffs(current, next);

    sanityCheckDiffs(diffs, current, next, diffRules, projectRule);
  }
};

export const sanityCheckDiffs = (
  diffs: Diff[],
  current: DiffableProject,
  next: DiffableProject,
  diffRules: DiffRule[],
  projectRules: ProjectRule[],
): void => {
  // Project rules run on the full set of diffs, the current build, and the next build.

  // Loop through the diffs and call each DiffRule.
  // We loop once so each rule does not need to loop.
  if (diffs) {
    for (const diff of diffs) {
      for (const rule of diffRules) {
        rule(diff, current, next);
      }
    }

    for (const projectRule of projectRules) {
      projectRule(diffs, current, next);
    }
  }
};

/**
 * Throws a helpful error when a customer is trying to complete an invalid migration.
 * Users are unable to update a KeySchema after the table has been deployed.
 * @param diffs The set of diffs between currentBuild and nextBuild.
 * @param currentBuild The last deployed build.
 * @param nextBuild The next build.
 */
export const cantEditKeySchemaRule = (diff: Diff): void => {
  if (diff.kind === 'E' && diff.path.length === 8 && diff.path[5] === 'KeySchema') {
    // diff.path = [ "stacks", "Todo.json", "Resources", "TodoTable", "Properties", "KeySchema", 0, "AttributeName"]
    const stackName = path.basename(diff.path[1], '.json');
    const tableName = diff.path[3];

    throw new InvalidMigrationError(
      `Attempting to edit the key schema of the ${tableName} table in the ${stackName} stack. `,
      'Adding a primary @key directive to an existing @model. ',
      'Remove the @key directive or provide a name e.g @key(name: "ByStatus", fields: ["status"]).',
    );
  }
};

/**
 * Throws a helpful error when a customer is trying to complete an invalid migration.
 * Users are unable to add LSIs after the table has been created.
 * @param diffs The set of diffs between currentBuild and nextBuild.
 * @param currentBuild The last deployed build.
 * @param nextBuild The next build.
 */
export const cantAddLSILaterRule = (diff: Diff): void => {
  if (
    // When adding a LSI to a table that has 0 LSIs.
    (diff.kind === 'N' && diff.path.length === 6 && diff.path[5] === 'LocalSecondaryIndexes') ||
    // When adding a LSI to a table that already has at least one LSI.
    (diff.kind === 'A' && diff.path.length === 6 && diff.path[5] === 'LocalSecondaryIndexes' && diff.item.kind === 'N')
  ) {
    // diff.path = [ "stacks", "Todo.json", "Resources", "TodoTable", "Properties", "LocalSecondaryIndexes" ]
    const stackName = path.basename(diff.path[1], '.json');
    const tableName = diff.path[3];

    throw new InvalidMigrationError(
      `Attempting to add a local secondary index to the ${tableName} table in the ${stackName} stack. ` +
        'Local secondary indexes must be created when the table is created.',
      "Adding a @key directive where the first field in 'fields' is the same as the first field in the 'fields' of the primary @key.",
      "Change the first field in 'fields' such that a global secondary index is created or delete and recreate the model.",
    );
  }
};

/**
 * Throws a helpful error when a customer is trying to complete an invalid migration.
 * Users are unable to change GSI KeySchemas after they are created.
 * @param diffs The set of diffs between currentBuild and nextBuild.
 * @param currentBuild The last deployed build.
 * @param nextBuild The next build.
 */
export const cantEditGSIKeySchemaRule = (diff: Diff, currentBuild: DiffableProject, nextBuild: DiffableProject): void => {
  const throwError = (indexName: string, stackName: string, tableName: string): void => {
    throw new InvalidGSIMigrationError(
      `Attempting to edit the global secondary index ${indexName} on the ${tableName} table in the ${stackName} stack. `,
      'The key schema of a global secondary index cannot be changed after being deployed.',
      'If using @key, first add a new @key, run `amplify push`, ' +
        'and then remove the old @key. If using @connection, first remove the @connection, run `amplify push`, ' +
        'and then add the new @connection with the new configuration.',
    );
  };

  if (
    // implies a field was changed in a GSI after it was created.
    // Path like:["stacks","Todo.json","Resources","TodoTable","Properties","GlobalSecondaryIndexes",0,"KeySchema",0,"AttributeName"]
    (diff.kind === 'E' && diff.path.length === 10 && diff.path[5] === 'GlobalSecondaryIndexes' && diff.path[7] === 'KeySchema') ||
    // implies a field was added to a GSI after it was created.
    // Path like: [ "stacks", "Comment.json", "Resources", "CommentTable", "Properties", "GlobalSecondaryIndexes", 0, "KeySchema" ]
    (diff.kind === 'A' && diff.path.length === 8 && diff.path[5] === 'GlobalSecondaryIndexes' && diff.path[7] === 'KeySchema')
  ) {
    // This error is symptomatic of a change to the GSI array but does not necessarily imply a breaking change.
    const pathToGSIs = diff.path.slice(0, 6);
    const oldIndexes = _.get(currentBuild, pathToGSIs);
    const newIndexes = _.get(nextBuild, pathToGSIs);
    const oldIndexesDiffable = _.keyBy(oldIndexes, 'IndexName');
    const newIndexesDiffable = _.keyBy(newIndexes, 'IndexName');
    const innerDiffs = getDiffs(oldIndexesDiffable, newIndexesDiffable) || [];

    // We must look at this inner diff or else we could confuse a situation
    // where the user adds a GSI to the beginning of the GlobalSecondaryIndexes list in CFN.
    // We re-key the indexes list so we can determine if a change occurred to an index that
    // already exists.
    for (const innerDiff of innerDiffs) {
      // path: ["AGSI","KeySchema",0,"AttributeName"]
      if (innerDiff.kind === 'E' && innerDiff.path.length > 2 && innerDiff.path[1] === 'KeySchema') {
        const indexName = innerDiff.path[0];
        const stackName = path.basename(diff.path[1], '.json');
        const tableName = diff.path[3];

        throwError(indexName, stackName, tableName);
      } else if (innerDiff.kind === 'A' && innerDiff.path.length === 2 && innerDiff.path[1] === 'KeySchema') {
        // Path like - ["gsi-PostComments", "KeySchema" ]
        const indexName = innerDiff.path[0];
        const stackName = path.basename(diff.path[1], '.json');
        const tableName = diff.path[3];

        throwError(indexName, stackName, tableName);
      }
    }
  }
};

/**
 * Throws a helpful error when a customer is trying to complete an invalid migration.
 * Users are unable to add and remove GSIs at the same time.
 * @param diffs The set of diffs between currentBuild and nextBuild.
 * @param currentBuild The last deployed build.
 * @param nextBuild The next build.
 */
export const cantAddAndRemoveGSIAtSameTimeRule = (diff: Diff, currentBuild: DiffableProject, nextBuild: DiffableProject): void => {
  const throwError = (stackName: string, tableName: string): void => {
    throw new InvalidGSIMigrationError(
      `Attempting to add and remove a global secondary index at the same time on the ${tableName} table in the ${stackName} stack. `,
      'You may only change one global secondary index in a single CloudFormation stack update. ',
      'If using @key, change one @key at a time. ' +
        'If using @connection, add the new @connection, run `amplify push`, ' +
        'and then remove the new @connection with the new configuration.',
    );
  };

  if (
    // implies a field was changed in a GSI after it was created.
    // Path like:["stacks","Todo.json","Resources","TodoTable","Properties","GlobalSecondaryIndexes", ... ]
    diff.kind === 'E' &&
    diff.path.length > 6 &&
    diff.path[5] === 'GlobalSecondaryIndexes'
  ) {
    // This error is symptomatic of a change to the GSI array but does not necessarily imply a breaking change.
    const pathToGSIs = diff.path.slice(0, 6);
    const oldIndexes = _.get(currentBuild, pathToGSIs);
    const newIndexes = _.get(nextBuild, pathToGSIs);
    const oldIndexesDiffable = _.keyBy(oldIndexes, 'IndexName');
    const newIndexesDiffable = _.keyBy(newIndexes, 'IndexName');
    const innerDiffs = getDiffs(oldIndexesDiffable, newIndexesDiffable) || [];

    let sawDelete = false;
    let sawNew = false;

    for (const diff of innerDiffs) {
      // A path of length 1 means an entire GSI was created or deleted.
      if (diff.path.length === 1 && diff.kind === 'D') {
        sawDelete = true;
      }

      if (diff.path.length === 1 && diff.kind === 'N') {
        sawNew = true;
      }
    }

    if (sawDelete && sawNew) {
      const stackName = path.basename(diff.path[1], '.json');
      const tableName = diff.path[3];

      throwError(stackName, tableName);
    }
  }
};

export const cantBatchMutateGSIAtUpdateTimeRule = (diff: Diff, currentBuild: DiffableProject, nextBuild: DiffableProject): void => {
  // path indicating adding new gsis or removing gsis from table
  // ['stacks', 'Book.json', 'Resources', 'BookTable', 'Properties', 'GlobalSecondaryIndexes']
  if ((diff.kind === 'D' || diff.kind === 'N') && diff.path.length === 6 && diff.path.slice(-1)[0] === 'GlobalSecondaryIndexes') {
    const tableName = diff.path[3];
    const stackName = diff.path[1];

    throw new InvalidGSIMigrationError(
      `Attempting to add and remove a global secondary index at the same time on the ${tableName} table in the ${stackName} stack. `,
      'You may only change one global secondary index in a single CloudFormation stack update. ',
      'If using @key, change one @key at a time. ' +
        'If using @connection, add the new @connection, run `amplify push`, ' +
        'and then remove the new @connection with the new configuration.',
    );
  }
};

/**
 * Throws a helpful error when a customer is trying to complete an invalid migration.
 * Users are unable to add multiple GSIs at the same time in update stage.
 * @param diffs The set of diffs between currentBuild and nextBuild.
 * @param currentBuild The last deployed build.
 * @param nextBuild The next build.
 */
export const cantMutateMultipleGSIAtUpdateTimeRule = (diffs: Diff[], currentBuild: DiffableProject, nextBuild: DiffableProject): void => {
  const throwError = (stackName: string, tableName: string): void => {
    throw new InvalidGSIMigrationError(
      `Attempting to mutate more than 1 global secondary index at the same time on the ${tableName} table in the ${stackName} stack. `,
      'You may only mutate one global secondary index in a single CloudFormation stack update. ',
      'If using @key, include one @key at a time. ' +
        'If using @connection, just add one new @connection which is using @key, run `amplify push`, ',
    );
  };

  if (diffs) {
    // update flow counting the tables which need more than one gsi update
    const seenTables: Set<String> = new Set();

    for (const diff of diffs) {
      if (
        // implies a field was changed in a GSI after it was created if it ends in GSI
        // Path like: ["stacks","Todo.json","Resources","TodoTable","Properties","GlobalSecondaryIndexes" ]
        diff.kind === 'A' &&
        diff.path.length >= 6 &&
        diff.path.slice(-1)[0] === 'GlobalSecondaryIndexes'
      ) {
        const diffTableName = diff.path[3];

        if ((diff.item.kind === 'N' || diff.item.kind === 'D') && !seenTables.has(diffTableName)) {
          seenTables.add(diffTableName);
        } else if (seenTables.has(diffTableName)) {
          const stackName = path.basename(diff.path[1], '.json');

          throwError(stackName, diffTableName);
        }
      }
    }
  }
};

/**
 * Throws a helpful error when a customer is trying to complete an invalid migration.
 * Users are unable to change LSI KeySchemas after they are created.
 * @param diffs The set of diffs between currentBuild and nextBuild.
 * @param currentBuild The last deployed build.
 * @param nextBuild The next build.
 */
export const cantEditLSIKeySchemaRule = (diff: Diff, currentBuild: DiffableProject, nextBuild: DiffableProject): void => {
  if (
    // ["stacks","Todo.json","Resources","TodoTable","Properties","LocalSecondaryIndexes",0,"KeySchema",0,"AttributeName"]
    diff.kind === 'E' &&
    diff.path.length === 10 &&
    diff.path[5] === 'LocalSecondaryIndexes' &&
    diff.path[7] === 'KeySchema'
  ) {
    // This error is symptomatic of a change to the GSI array but does not necessarily imply a breaking change.
    const pathToGSIs = diff.path.slice(0, 6);
    const oldIndexes = _.get(currentBuild, pathToGSIs);
    const newIndexes = _.get(nextBuild, pathToGSIs);
    const oldIndexesDiffable = _.keyBy(oldIndexes, 'IndexName');
    const newIndexesDiffable = _.keyBy(newIndexes, 'IndexName');
    const innerDiffs = getDiffs(oldIndexesDiffable, newIndexesDiffable) || [];

    // We must look at this inner diff or else we could confuse a situation
    // where the user adds a LSI to the beginning of the LocalSecondaryIndex list in CFN.
    // We re-key the indexes list so we can determine if a change occurred to an index that
    // already exists.
    for (const innerDiff of innerDiffs) {
      // path: ["AGSI","KeySchema",0,"AttributeName"]
      if (innerDiff.kind === 'E' && innerDiff.path.length > 2 && innerDiff.path[1] === 'KeySchema') {
        const indexName = innerDiff.path[0];
        const stackName = path.basename(diff.path[1], '.json');
        const tableName = diff.path[3];

        throw new InvalidMigrationError(
          `Attempting to edit the local secondary index ${indexName} on the ${tableName} table in the ${stackName} stack. `,
          'The key schema of a local secondary index cannot be changed after being deployed.',
          'When enabling new access patterns you should: 1. Add a new @key 2. run amplify push ' +
            '3. Verify the new access pattern and remove the old @key.',
        );
      }
    }
  }
};

export function cantRemoveLSILater(diff: Diff, currentBuild: DiffableProject, nextBuild: DiffableProject) {
  const throwError = (stackName: string, tableName: string): void => {
    throw new InvalidMigrationError(
      `Attempting to remove a local secondary index on the ${tableName} table in the ${stackName} stack.`,
      'A local secondary index cannot be removed after deployment.',
      'In order to remove the local secondary index you need to delete or rename the table.',
    );
  };
  // if removing more than one lsi
  if (diff.kind === 'D' && diff.lhs && diff.path.length === 6 && diff.path[5] === 'LocalSecondaryIndexes') {
    const tableName = diff.path[3];
    const stackName = path.basename(diff.path[1], '.json');
    throwError(stackName, tableName);
  }
  // if removing one lsi
  if (diff.kind === 'A' && diff.item.kind === 'D' && diff.path.length === 6 && diff.path[5] === 'LocalSecondaryIndexes') {
    const tableName = diff.path[3];
    const stackName = path.basename(diff.path[1], '.json');
    throwError(stackName, tableName);
  }
}

export const cantHaveMoreThan500ResourcesRule = (diffs: Diff[], currentBuild: DiffableProject, nextBuild: DiffableProject): void => {
  const stackKeys = Object.keys(nextBuild.stacks);

  for (const stackName of stackKeys) {
    const stack = nextBuild.stacks[stackName];

    if (stack && stack.Resources && Object.keys(stack.Resources).length > 500) {
      throw new InvalidMigrationError(
        `The ${stackName} stack defines more than 500 resources.`,
        'CloudFormation templates may contain at most 500 resources.',
        'If the stack is a custom stack, break the stack up into multiple files in stacks/. ' +
          'If the stack was generated, you have hit a limit and can use the StackMapping argument in ' +
          `${TRANSFORM_CONFIG_FILE_NAME} to fine tune how resources are assigned to stacks.`,
      );
    }
  }
};

const loadDiffableProject = async (path: string, rootStackName: string): Promise<DiffableProject> => {
  const project = await readFromPath(path);
  const currentStacks = project.stacks || {};
  const diffableProject: DiffableProject = {
    stacks: {},
    root: {},
  };

  for (const key of Object.keys(currentStacks)) {
    diffableProject.stacks[key] = JSONUtilities.parse(project.stacks[key]);
  }

  if (project[rootStackName]) {
    diffableProject.root = JSONUtilities.parse(project[rootStackName]);
  }

  return diffableProject;
};
