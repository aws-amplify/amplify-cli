/**
 * generates a random string
 */
export declare const getShortId: () => string;
/**
 * Given the parameter objects of each project for the provided category & resource key,
 * you can modify the parameter objects before the diff is performed.
 *
 * You can use conditional logic to delete attributes on the parameter objects before they are diffed, if
 * you want to exclude those attributes from the comparison. Make sure to return the modified objects
 * that you want to be diffed.
 */
export type ExcludeFromParameterDiff = (currentCategory: string, currentResourceKey: string, parameters: {
    project1: Record<string, unknown>;
    project2: Record<string, unknown>;
}) => {
    project1: Record<string, unknown>;
    project2: Record<string, unknown>;
};
/**
 * Asserts that parameters between two project directories didn't drift.
 */
export declare const assertNoParameterChangesBetweenProjects: (projectRoot1: string, projectRoot2: string, options?: {
    excludeFromParameterDiff?: ExcludeFromParameterDiff;
}) => void;
/**
 * Given the CFN templates of each project for the provided category & resource key,
 * you can modify the CFN templates objects before the diff is performed.
 *
 * You can use conditional logic to delete attributes on the CFN object before they are diffed, if
 * you want to exclude those attributes from the comparison. Make sure to return the modified objects
 * that you want to be diffed.
 */
export type ExcludeFromCFNDiff = (currentCategory: string, currentResourceKey: string, cfnTemplates: {
    project1: Record<string, unknown>;
    project2: Record<string, unknown>;
}) => {
    project1: Record<string, unknown>;
    project2: Record<string, unknown>;
};
/**
 * Collects all differences between cloud formation templates into a single string.
 */
export declare const collectCloudformationDiffBetweenProjects: (projectRoot1: string, projectRoot2: string, excludeFn?: ExcludeFromCFNDiff) => string;
/**
 * Pulls and pushes project with latest codebase. Validates parameter and cfn drift.
 */
export declare const pullPushWithLatestCodebaseValidateParameterAndCfnDrift: (projRoot: string, projName: string) => Promise<void>;
