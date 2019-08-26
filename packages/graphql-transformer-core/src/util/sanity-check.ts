const fs = require('fs-extra');
import { basename } from 'path';
import { diff as getDiffs } from 'deep-diff';
import { readFromPath } from './fileUtils';
import { InvalidMigrationError } from '../errors';
import { Template } from 'cloudform-types';

interface Diff {
    kind: 'N' | 'E' | 'D' | 'A',
    path: string[],
    lhs?: any,
    rhs?: any,
    index?: number,
    item?: any
}

/**
 * Calculates a diff between the last saved cloud backend's build directory
 * and the most recent build.
 */
export async function check(currentCloudBackendDir: string, buildDirectory: string,
    rootStackName: string = 'cloudformation-template.json') {
    const cloudBackendDirectoryExists = await fs.exists(currentCloudBackendDir);
    const buildDirectoryExists = await fs.exists(buildDirectory);

    // Diff rules rule on a single Diff.
    const diffRules: DiffRule[] = [
        cantEditKeySchema,
        cantAddLSILater,
        cantEditGSIKeySchema,
        cantEditLSIKeySchema,
        cantAddAndRemoveGSIAtSameTime
    ];
    // Project rules run on the full set of diffs, the current build, and the next build.
    const projectRules: ProjectRule[] = [
        cantHaveMoreThan200Resources
    ];
    if (cloudBackendDirectoryExists && buildDirectoryExists) {
        const current = await loadDiffableProject(currentCloudBackendDir, rootStackName);
        const next = await loadDiffableProject(buildDirectory, rootStackName);
        const diffs = getDiffs(current, next);
        // Loop through the diffs and call each DiffRule.
        // We loop once so each rule does not need to loop.
        for (const diff of diffs) {
            for (const rule of diffRules) {
                rule(diff, current, next);
            }
        }
        for (const projectRule of projectRules) {
            projectRule(diffs, current, next);
        }
    }
}

/**
 * Rules
 */
type DiffRule = (diff: Diff, currentBuild: DiffableProject, nextBuild: DiffableProject) => void;
type ProjectRule = (diffs: Diff[], currentBuild: DiffableProject, nextBuild: DiffableProject) => void;

 /**
  * Throws a helpful error when a customer is trying to complete an invalid migration.
  * Users are unable to update a KeySchema after the table has been deployed.
  * @param diffs The set of diffs between currentBuild and nextBuild.
  * @param currentBuild The last deployed build.
  * @param nextBuild The next build.
  */
export function cantEditKeySchema(diff: Diff) {
    if (diff.kind === 'E' && diff.path.length === 8 && diff.path[5] === 'KeySchema') {
        // diff.path = [ "stacks", "Todo.json", "Resources", "TodoTable", "Properties", "KeySchema", 0, "AttributeName"]
        const stackName = basename(diff.path[1], '.json')
        const tableName = diff.path[3];
        throw new InvalidMigrationError(
            `Attempting to edit the key schema of the ${tableName} table in the ${stackName} stack. `,
            'Adding a primary @key directive to an existing @model. ',
            'Remove the @key directive or provide a name e.g @key(name: "ByStatus", fields: ["status"]).'
        );
    }
}

/**
  * Throws a helpful error when a customer is trying to complete an invalid migration.
  * Users are unable to add LSIs after the table has been created.
  * @param diffs The set of diffs between currentBuild and nextBuild.
  * @param currentBuild The last deployed build.
  * @param nextBuild The next build.
  */
export function cantAddLSILater(diff: Diff) {
    if (
        // When adding a LSI to a table that has 0 LSIs.
        (diff.kind === 'N' && diff.path.length === 6 && diff.path[5] === 'LocalSecondaryIndexes') ||
        // When adding a LSI to a table that already has at least one LSI.
        (diff.kind === 'A' && diff.path.length === 6 && diff.path[5] === 'LocalSecondaryIndexes' && diff.item.kind === 'N')
    ) {
        // diff.path = [ "stacks", "Todo.json", "Resources", "TodoTable", "Properties", "LocalSecondaryIndexes" ]
        const stackName = basename(diff.path[1], '.json')
        const tableName = diff.path[3];
        throw new InvalidMigrationError(
            `Attempting to add a local secondary index to the ${tableName} table in the ${stackName} stack. ` +
            'Local secondary indexes must be created when the table is created.',
            'Adding a @key directive where the first field in \'fields\' is the same as the first field in the \'fields\' of the primary @key.',
            'Change the first field in \'fields\' such that a global secondary index is created or delete and recreate the model.'
        );
    }
}

/**
  * Throws a helpful error when a customer is trying to complete an invalid migration.
  * Users are unable to change GSI KeySchemas after they are created.
  * @param diffs The set of diffs between currentBuild and nextBuild.
  * @param currentBuild The last deployed build.
  * @param nextBuild The next build.
  */
 export function cantEditGSIKeySchema(diff: Diff, currentBuild: DiffableProject, nextBuild: DiffableProject) {
    function throwError(indexName: string, stackName: string, tableName: string) {
        throw new InvalidMigrationError(
            `Attempting to edit the global secondary index ${indexName} on the ${tableName} table in the ${stackName} stack. `,
            'The key schema of a global secondary index cannot be changed after being deployed.',
            'If using @key, first add a new @key, run `amplify push`, ' +
            'and then remove the old @key. If using @connection, first remove the @connection, run `amplify push`, ' +
            'and then add the new @connection with the new configuration.'
        );
    }
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
        const oldIndexes = get(currentBuild, pathToGSIs);
        const newIndexes = get(nextBuild, pathToGSIs);
        const oldIndexesDiffable = keyBy(oldIndexes, 'IndexName');
        const newIndexesDiffable = keyBy(newIndexes, 'IndexName');
        const innerDiffs = getDiffs(oldIndexesDiffable, newIndexesDiffable);
        // We must look at this inner diff or else we could confuse a situation
        // where the user adds a GSI to the beginning of the GlobalSecondaryIndexes list in CFN.
        // We re-key the indexes list so we can determine if a change occured to an index that
        // already exists.
        for (const innerDiff of innerDiffs) {
            // path: ["AGSI","KeySchema",0,"AttributeName"]
            if (innerDiff.kind === 'E' && innerDiff.path.length > 2 && innerDiff.path[1] === 'KeySchema') {
                const indexName = innerDiff.path[0];
                const stackName = basename(diff.path[1], '.json')
                const tableName = diff.path[3];
                throwError(indexName, stackName, tableName);
            } else if (innerDiff.kind === 'A' && innerDiff.path.length === 2 && innerDiff.path[1] === 'KeySchema') {
                // Path like - ["gsi-PostComments", "KeySchema" ]
                const indexName = innerDiff.path[0];
                const stackName = basename(diff.path[1], '.json')
                const tableName = diff.path[3];
                throwError(indexName, stackName, tableName);
            }
        }
    }
}

/**
  * Throws a helpful error when a customer is trying to complete an invalid migration.
  * Users are unable to add and remove GSIs at the same time.
  * @param diffs The set of diffs between currentBuild and nextBuild.
  * @param currentBuild The last deployed build.
  * @param nextBuild The next build.
  */
 export function cantAddAndRemoveGSIAtSameTime(diff: Diff, currentBuild: DiffableProject, nextBuild: DiffableProject) {
    function throwError(stackName: string, tableName: string) {
        throw new InvalidMigrationError(
            `Attempting to add and remove a global secondary index at the same time on the ${tableName} table in the ${stackName} stack. `,
            'You may only change one global secondary index in a single CloudFormation stack update. ',
            'If using @key, change one @key at a time. ' +
            'If using @connection, add the new @connection, run `amplify push`, ' +
            'and then remove the new @connection with the new configuration.'
        );
    }
    if (
        // implies a field was changed in a GSI after it was created.
        // Path like:["stacks","Todo.json","Resources","TodoTable","Properties","GlobalSecondaryIndexes", ... ]
        diff.kind === 'E' && diff.path.length > 6 && diff.path[5] === 'GlobalSecondaryIndexes'
    ) {
        // This error is symptomatic of a change to the GSI array but does not necessarily imply a breaking change.
        const pathToGSIs = diff.path.slice(0, 6);
        const oldIndexes = get(currentBuild, pathToGSIs);
        const newIndexes = get(nextBuild, pathToGSIs);
        const oldIndexesDiffable = keyBy(oldIndexes, 'IndexName');
        const newIndexesDiffable = keyBy(newIndexes, 'IndexName');
        const innerDiffs = getDiffs(oldIndexesDiffable, newIndexesDiffable);
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
            const stackName = basename(diff.path[1], '.json')
            const tableName = diff.path[3];
            throwError(stackName, tableName);
        }
    }
}

/**
  * Throws a helpful error when a customer is trying to complete an invalid migration.
  * Users are unable to change LSI KeySchemas after they are created.
  * @param diffs The set of diffs between currentBuild and nextBuild.
  * @param currentBuild The last deployed build.
  * @param nextBuild The next build.
  */
 export function cantEditLSIKeySchema(diff: Diff, currentBuild: DiffableProject, nextBuild: DiffableProject) {
    if (
        // ["stacks","Todo.json","Resources","TodoTable","Properties","LocalSecondaryIndexes",0,"KeySchema",0,"AttributeName"]
        diff.kind === 'E' && diff.path.length === 10 && diff.path[5] === 'LocalSecondaryIndexes' && diff.path[7] === 'KeySchema'
    ) {
        // This error is symptomatic of a change to the GSI array but does not necessarily imply a breaking change.
        const pathToGSIs = diff.path.slice(0, 6);
        const oldIndexes = get(currentBuild, pathToGSIs);
        const newIndexes = get(nextBuild, pathToGSIs);
        const oldIndexesDiffable = keyBy(oldIndexes, 'IndexName');
        const newIndexesDiffable = keyBy(newIndexes, 'IndexName');
        const innerDiffs = getDiffs(oldIndexesDiffable, newIndexesDiffable);
        // We must look at this inner diff or else we could confuse a situation
        // where the user adds a LSI to the beginning of the LocalSecondaryIndex list in CFN.
        // We re-key the indexes list so we can determine if a change occured to an index that
        // already exists.
        for (const innerDiff of innerDiffs) {
            // path: ["AGSI","KeySchema",0,"AttributeName"]
            if (innerDiff.kind === 'E' && innerDiff.path.length > 2 && innerDiff.path[1] === 'KeySchema') {
                const indexName = innerDiff.path[0];
                const stackName = basename(diff.path[1], '.json')
                const tableName = diff.path[3];
                throw new InvalidMigrationError(
                    `Attempting to edit the local secondary index ${indexName} on the ${tableName} table in the ${stackName} stack. `,
                    'The key schema of a local secondary index cannot be changed after being deployed.',
                    'When enabling new access patterns you should: 1. Add a new @key 2. run amplify push ' +
                    '3. Verify the new access pattern and remove the old @key.'
                );
            }
        }
    }
}

export function cantHaveMoreThan200Resources(diffs: Diff[], currentBuild: DiffableProject, nextBuild: DiffableProject) {
    const stackKeys = Object.keys(nextBuild.stacks);
    for (const stackName of stackKeys) {
        const stack = nextBuild.stacks[stackName];
        if (stack && stack.Resources && Object.keys(stack.Resources).length > 200) {
            throw new InvalidMigrationError(
                `The ${stackName} stack defines more than 200 resources.`,
                'CloudFormation templates may contain at most 200 resources.',
                'If the stack is a custom stack, break the stack up into multiple files in stacks/. ' +
                'If the stack was generated, you have hit a limit and can use the StackMapping argument in ' +
                'transform.conf.json to fine tune how resources are assigned to stacks.'
            )
        }
    }
}

// Takes a list of object and returns an object keyed by the given attribute.
// This allows us to make more accurate diffs.
function keyBy(objects: any[], attr: string) {
    return objects.reduce((acc, obj) => ({
        ...acc,
        [obj[attr]]: obj
    }), {});
}

// Helpers
interface DiffableProject {
    stacks: {
        [stackName: string]: Template
    },
    root: Template
}
async function loadDiffableProject(path: string, rootStackName: string): Promise<DiffableProject> {
    const project = await readFromPath(path);
    const currentStacks = project.stacks || {};
    const diffableProject: DiffableProject = {
        stacks: {},
        root: {}
    };
    for (const key of Object.keys(currentStacks)) {
        diffableProject.stacks[key] = JSON.parse(project.stacks[key]);
    }
    diffableProject.root = JSON.parse(project[rootStackName]);
    return diffableProject;
}

/**
 * Given an object and a path, get the value from the object at the path.
 * If the full path does not exist, returns undefined.
 * @param obj The object.
 * @param path The path.
 */
function get(obj: any, path: string[]) {
    let tmp = obj;
    for (const part of path) {
        tmp = tmp[part];
        if (!tmp) {
            return undefined;
        }
    }
    return tmp;
}