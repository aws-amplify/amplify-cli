import { ViewResourceTableParams } from 'amplify-cli-core';
import { getResourceStatus, getHashForResourceDir } from './resource-status-data';
export { getResourceStatus, getHashForResourceDir };
export declare function showStatusTable(tableViewFilter: ViewResourceTableParams): Promise<boolean | undefined>;
export declare function showResourceTable(category?: any, resourceName?: any, filteredResources?: any): Promise<boolean | undefined>;
//# sourceMappingURL=resource-status.d.ts.map