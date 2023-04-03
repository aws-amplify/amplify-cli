import { $TSAny, ViewResourceTableParams } from 'amplify-cli-core';
import * as resourceStatus from './resource-status-diff';
import { IResourceDiffCollection } from './resource-status-diff';
export interface IResourceGroups {
    resourcesToBeUpdated: Array<$TSAny>;
    resourcesToBeDeleted: Array<$TSAny>;
    resourcesToBeCreated: Array<$TSAny>;
    resourcesToBeSynced: Array<$TSAny>;
    allResources: Array<$TSAny>;
    rootStackUpdated?: boolean;
    tagsUpdated?: boolean;
}
declare type SummaryCell = $TSAny;
declare type SummaryRow = Array<SummaryCell>;
declare type SummaryTable = Array<SummaryRow>;
export declare const getMultiCategoryStatus: (inputs: ViewResourceTableParams | undefined) => Promise<IResourceGroups>;
export declare const getResourceDiffs: (resourcesToBeUpdated: Array<$TSAny>, resourcesToBeDeleted: Array<$TSAny>, resourcesToBeCreated: Array<$TSAny>) => Promise<IResourceDiffCollection>;
export declare const getSummaryTableData: ({ resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeCreated, resourcesToBeSynced, allResources, }: {
    resourcesToBeUpdated: any;
    resourcesToBeDeleted: any;
    resourcesToBeCreated: any;
    resourcesToBeSynced: any;
    allResources: any;
}) => SummaryTable;
interface IBackendConfigs {
    currentBackendConfig: $TSAny;
    backendConfig: $TSAny;
}
export declare const getResourceStatus: (category?: string | undefined, resourceName?: string | undefined, providerName?: string | undefined, filteredResources?: any[] | undefined) => Promise<resourceStatus.ICategoryStatusCollection>;
export declare const getAllResources: (amplifyMeta: $TSAny, category: $TSAny, resourceName: string | undefined, filteredResources: Array<$TSAny> | undefined) => Array<$TSAny>;
export declare const getResourcesToBeCreated: (amplifyMeta: $TSAny, currentAmplifyMeta: $TSAny, category: string | undefined, resourceName: string | undefined, filteredResources: Array<$TSAny> | undefined) => Array<$TSAny>;
export declare const getResourcesToBeDeleted: (amplifyMeta: $TSAny, currentAmplifyMeta: $TSAny, category: string | undefined, resourceName: string | undefined, filteredResources: Array<$TSAny> | undefined) => Array<$TSAny>;
export declare const getResourcesToBeUpdated: (amplifyMeta: $TSAny, currentAmplifyMeta: $TSAny, backendConfigs: IBackendConfigs, category: string | undefined, resourceName: string | undefined, filteredResources: Array<$TSAny> | undefined) => Promise<$TSAny[]>;
export declare const getResourcesToBeSynced: (amplifyMeta: $TSAny, currentAmplifyMeta: $TSAny, category: string | undefined, resourceName: string | undefined, filteredResources: Array<$TSAny> | undefined) => Array<$TSAny>;
export declare const getAmplifyMeta: () => $TSAny;
export declare const getLocalAndDeployedBackendConfig: () => IBackendConfigs;
export declare const getHashForResourceDir: (dirPath: string, files?: string[] | undefined) => Promise<string>;
export declare const getResourceService: (category: string, resourceName: string) => string;
export {};
//# sourceMappingURL=resource-status-data.d.ts.map