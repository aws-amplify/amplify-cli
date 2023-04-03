import chalk from 'chalk';
import * as cfnDiff from '@aws-cdk/cloudformation-diff';
import { $TSAny } from 'amplify-cli-core';
import { Template } from 'cloudform-types';
export interface StackMutationInfo {
    label: string;
    consoleStyle: chalk.Chalk;
    icon: string;
}
export interface StackMutationType {
    CREATE: StackMutationInfo;
    UPDATE: StackMutationInfo;
    DELETE: StackMutationInfo;
    IMPORT: StackMutationInfo;
    UNLINK: StackMutationInfo;
    NOCHANGE: StackMutationInfo;
}
export declare const stackMutationType: StackMutationType;
export declare const capitalize: (str: string) => string;
interface IResourcePaths {
    localPreBuildCfnFile: string;
    cloudPreBuildCfnFile: string;
    localBuildCfnFile: string;
    cloudBuildCfnFile: string;
}
export declare const globCFNFilePath: (fileFolder: string) => string;
export declare class ResourceDiff {
    resourceName: string;
    category: string;
    provider: string;
    service: string;
    resourceFiles: IResourcePaths;
    localBackendDir: string;
    cloudBackendDir: string;
    localTemplate: Template;
    cloudTemplate: Template;
    mutationInfo: StackMutationInfo;
    constructor(category: string, resourceName: string, provider: string, mutationInfo: StackMutationInfo);
    printResourceDetailStatus: (mutationInfo: StackMutationInfo) => Promise<void>;
    calculateCfnDiff: () => Promise<cfnDiff.TemplateDiff>;
    private safeReadCFNTemplate;
    private getCfnResourceFilePaths;
    private normalizeProviderForFileNames;
    private printStackDiff;
    private safeGlobCFNFilePath;
    private isResourceTypeCDKMetada;
}
export interface IResourceDiffCollection {
    updatedDiff: ResourceDiff[] | [];
    deletedDiff: ResourceDiff[] | [];
    createdDiff: ResourceDiff[] | [];
}
export interface ICategoryStatusCollection {
    resourcesToBeCreated: $TSAny[];
    resourcesToBeUpdated: $TSAny[];
    resourcesToBeDeleted: $TSAny[];
    resourcesToBeSynced: $TSAny[];
    rootStackUpdated?: boolean;
    allResources: $TSAny[];
    tagsUpdated: boolean;
}
export declare const CollateResourceDiffs: (resources: any, mutationInfo: StackMutationInfo) => Promise<ResourceDiff[]>;
export {};
//# sourceMappingURL=resource-status-diff.d.ts.map