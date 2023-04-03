"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showResourceTable = exports.showStatusTable = exports.getHashForResourceDir = exports.getResourceStatus = void 0;
const print_1 = require("./print");
const get_cloud_init_status_1 = require("./get-cloud-init-status");
const resource_status_view_1 = require("./resource-status-view");
const resource_status_data_1 = require("./resource-status-data");
Object.defineProperty(exports, "getResourceStatus", { enumerable: true, get: function () { return resource_status_data_1.getResourceStatus; } });
Object.defineProperty(exports, "getHashForResourceDir", { enumerable: true, get: function () { return resource_status_data_1.getHashForResourceDir; } });
async function showStatusTable(tableViewFilter) {
    const amplifyProjectInitStatus = (0, get_cloud_init_status_1.getCloudInitStatus)();
    const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeSynced, allResources, tagsUpdated } = await (0, resource_status_data_1.getMultiCategoryStatus)(tableViewFilter);
    if (amplifyProjectInitStatus === get_cloud_init_status_1.CLOUD_INITIALIZED) {
        (0, resource_status_view_1.viewEnvInfo)();
    }
    (0, resource_status_view_1.viewSummaryTable)({ resourcesToBeUpdated, resourcesToBeCreated, resourcesToBeDeleted, resourcesToBeSynced, allResources });
    if (tagsUpdated) {
        print_1.print.info('\nTag Changes Detected');
    }
    if (tableViewFilter.verbose) {
        await (0, resource_status_view_1.viewResourceDiffs)({ resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeCreated });
    }
    const resourceChanged = resourcesToBeCreated.length + resourcesToBeUpdated.length + resourcesToBeSynced.length + resourcesToBeDeleted.length > 0 || tagsUpdated;
    return resourceChanged;
}
exports.showStatusTable = showStatusTable;
async function showResourceTable(category, resourceName, filteredResources) {
    const amplifyProjectInitStatus = (0, get_cloud_init_status_1.getCloudInitStatus)();
    const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeSynced, allResources, tagsUpdated, rootStackUpdated, } = await (0, resource_status_data_1.getResourceStatus)(category, resourceName, undefined, filteredResources);
    if (amplifyProjectInitStatus === get_cloud_init_status_1.CLOUD_INITIALIZED) {
        (0, resource_status_view_1.viewEnvInfo)();
    }
    (0, resource_status_view_1.viewSummaryTable)({ resourcesToBeUpdated, resourcesToBeCreated, resourcesToBeDeleted, resourcesToBeSynced, allResources });
    if (tagsUpdated) {
        print_1.print.info('\nTag Changes Detected');
    }
    const resourceChanged = resourcesToBeCreated.length + resourcesToBeUpdated.length + resourcesToBeSynced.length + resourcesToBeDeleted.length > 0 ||
        tagsUpdated ||
        rootStackUpdated;
    return resourceChanged;
}
exports.showResourceTable = showResourceTable;
//# sourceMappingURL=resource-status.js.map