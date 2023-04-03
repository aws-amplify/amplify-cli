"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourceService = exports.getHashForResourceDir = exports.getLocalAndDeployedBackendConfig = exports.getAmplifyMeta = exports.getResourcesToBeSynced = exports.getResourcesToBeUpdated = exports.getResourcesToBeDeleted = exports.getResourcesToBeCreated = exports.getAllResources = exports.getResourceStatus = exports.getSummaryTableData = exports.getResourceDiffs = exports.getMultiCategoryStatus = void 0;
const amplify_category_function_1 = require("@aws-amplify/amplify-category-function");
const amplify_cli_core_1 = require("amplify-cli-core");
const folder_hash_1 = require("folder-hash");
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const remove_pinpoint_policy_1 = require("./remove-pinpoint-policy");
const get_cloud_init_status_1 = require("./get-cloud-init-status");
const resourceStatus = __importStar(require("./resource-status-diff"));
const resource_status_diff_1 = require("./resource-status-diff");
const root_stack_status_1 = require("./root-stack-status");
const getMultiCategoryStatus = async (inputs) => {
    var _a;
    const resourceStatusResults = await (0, exports.getResourceStatus)();
    if ((_a = inputs === null || inputs === void 0 ? void 0 : inputs.categoryList) === null || _a === void 0 ? void 0 : _a.length) {
        resourceStatusResults.resourcesToBeCreated = filterResourceCategory(resourceStatusResults.resourcesToBeCreated, inputs.categoryList);
        resourceStatusResults.resourcesToBeUpdated = filterResourceCategory(resourceStatusResults.resourcesToBeUpdated, inputs.categoryList);
        resourceStatusResults.resourcesToBeSynced = filterResourceCategory(resourceStatusResults.resourcesToBeSynced, inputs.categoryList);
        resourceStatusResults.resourcesToBeDeleted = filterResourceCategory(resourceStatusResults.resourcesToBeDeleted, inputs.categoryList);
        resourceStatusResults.allResources = filterResourceCategory(resourceStatusResults.allResources, inputs.categoryList);
    }
    return resourceStatusResults;
};
exports.getMultiCategoryStatus = getMultiCategoryStatus;
const getResourceDiffs = async (resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeCreated) => {
    const result = {
        updatedDiff: await resourceStatus.CollateResourceDiffs(resourcesToBeUpdated, resourceStatus.stackMutationType.UPDATE),
        deletedDiff: await resourceStatus.CollateResourceDiffs(resourcesToBeDeleted, resourceStatus.stackMutationType.DELETE),
        createdDiff: await resourceStatus.CollateResourceDiffs(resourcesToBeCreated, resourceStatus.stackMutationType.CREATE),
    };
    return result;
};
exports.getResourceDiffs = getResourceDiffs;
const resourceToTableRow = (resource, operation) => [
    (0, resource_status_diff_1.capitalize)(resource.category),
    resource.resourceName,
    operation,
    resource.providerPlugin,
];
const ResourceOperationLabel = {
    Create: 'Create',
    Update: 'Update',
    Delete: 'Delete',
    Import: 'Import',
    Unlink: 'Unlink',
    NoOp: 'No Change',
};
const TableColumnLabels = {
    Category: 'Category',
    ResourceName: 'Resource name',
    Operation: 'Operation',
    ProviderPlugin: 'Provider plugin',
};
const getLabelForResourceSyncOperation = (syncOperationType) => {
    switch (syncOperationType) {
        case 'import':
            return ResourceOperationLabel.Import;
        case 'unlink':
            return ResourceOperationLabel.Unlink;
        default:
            return ResourceOperationLabel.NoOp;
    }
};
const getSummaryTableData = ({ resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeCreated, resourcesToBeSynced, allResources, }) => {
    let noChangeResources = lodash_1.default.differenceWith(allResources, resourcesToBeCreated.concat(resourcesToBeUpdated).concat(resourcesToBeSynced), lodash_1.default.isEqual);
    noChangeResources = noChangeResources.filter((resource) => resource.category !== 'providers');
    const tableOptions = [
        [TableColumnLabels.Category, TableColumnLabels.ResourceName, TableColumnLabels.Operation, TableColumnLabels.ProviderPlugin],
    ];
    for (const resource of resourcesToBeCreated) {
        tableOptions.push(resourceToTableRow(resource, ResourceOperationLabel.Create));
    }
    for (const resource of resourcesToBeUpdated) {
        tableOptions.push(resourceToTableRow(resource, ResourceOperationLabel.Update));
    }
    for (const resource of resourcesToBeSynced) {
        const operation = getLabelForResourceSyncOperation(resource.sync);
        tableOptions.push(resourceToTableRow(resource, operation));
    }
    for (const resource of resourcesToBeDeleted) {
        tableOptions.push(resourceToTableRow(resource, ResourceOperationLabel.Delete));
    }
    for (const resource of noChangeResources) {
        tableOptions.push(resourceToTableRow(resource, ResourceOperationLabel.NoOp));
    }
    return tableOptions;
};
exports.getSummaryTableData = getSummaryTableData;
const getResourceStatus = async (category, resourceName, providerName, filteredResources) => {
    const { amplifyMeta, currentAmplifyMeta } = (0, exports.getAmplifyMeta)();
    const backendConfigs = (0, exports.getLocalAndDeployedBackendConfig)();
    let resourcesToBeCreated = (0, exports.getResourcesToBeCreated)(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources);
    let resourcesToBeUpdated = await (0, exports.getResourcesToBeUpdated)(amplifyMeta, currentAmplifyMeta, backendConfigs, category, resourceName, filteredResources);
    let resourcesToBeSynced = (0, exports.getResourcesToBeSynced)(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources);
    let resourcesToBeDeleted = (0, exports.getResourcesToBeDeleted)(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources);
    let allResources = (0, exports.getAllResources)(amplifyMeta, category, resourceName, filteredResources);
    resourcesToBeCreated = resourcesToBeCreated.filter((resource) => resource.category !== 'provider');
    if (providerName) {
        resourcesToBeCreated = resourcesToBeCreated.filter((resource) => resource.providerPlugin === providerName);
        resourcesToBeUpdated = resourcesToBeUpdated.filter((resource) => resource.providerPlugin === providerName);
        resourcesToBeSynced = resourcesToBeSynced.filter((resource) => resource.providerPlugin === providerName);
        resourcesToBeDeleted = resourcesToBeDeleted.filter((resource) => resource.providerPlugin === providerName);
        allResources = allResources.filter((resource) => resource.providerPlugin === providerName);
    }
    const tagsUpdated = !lodash_1.default.isEqual(amplify_cli_core_1.stateManager.getProjectTags(), amplify_cli_core_1.stateManager.getCurrentProjectTags());
    const rootStackUpdated = await (0, root_stack_status_1.isRootStackModifiedSinceLastPush)();
    return {
        resourcesToBeCreated,
        resourcesToBeUpdated,
        resourcesToBeSynced,
        resourcesToBeDeleted,
        rootStackUpdated,
        tagsUpdated,
        allResources,
    };
};
exports.getResourceStatus = getResourceStatus;
const getAllResources = (amplifyMeta, category, resourceName, filteredResources) => {
    let resources = [];
    Object.keys(amplifyMeta).forEach((categoryName) => {
        const categoryItem = amplifyMeta[categoryName];
        Object.keys(categoryItem).forEach((resource) => {
            amplifyMeta[categoryName][resource].resourceName = resource;
            amplifyMeta[categoryName][resource].category = categoryName;
            resources.push(amplifyMeta[categoryName][resource]);
        });
    });
    resources = filterResources(resources, filteredResources);
    if (category !== undefined && resourceName !== undefined) {
        resources = resources.filter((resource) => resource.category === category && resource.resourceName === resourceName);
    }
    if (category !== undefined && !resourceName) {
        resources = resources.filter((resource) => resource.category === category);
    }
    return resources;
};
exports.getAllResources = getAllResources;
const getResourcesToBeCreated = (amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources) => {
    var _a, _b;
    let resources = [];
    Object.keys(amplifyMeta).forEach((categoryName) => {
        const categoryItem = amplifyMeta[categoryName];
        Object.keys(categoryItem).forEach((resource) => {
            var _a;
            if ((!((_a = amplifyMeta[categoryName][resource]) === null || _a === void 0 ? void 0 : _a.lastPushTimeStamp) ||
                !currentAmplifyMeta[categoryName] ||
                !currentAmplifyMeta[categoryName][resource]) &&
                categoryName !== 'providers' &&
                amplifyMeta[categoryName][resource].serviceType !== 'imported') {
                amplifyMeta[categoryName][resource].resourceName = resource;
                amplifyMeta[categoryName][resource].category = categoryName;
                resources.push(amplifyMeta[categoryName][resource]);
            }
        });
    });
    resources = filterResources(resources, filteredResources);
    if (category !== undefined && resourceName !== undefined) {
        resources = resources.filter((resource) => resource.category === category && resource.resourceName === resourceName);
    }
    if (category !== undefined && !resourceName) {
        resources = resources.filter((resource) => resource.category === category);
    }
    for (let i = 0; i < resources.length; ++i) {
        if (resources[i].dependsOn && resources[i].dependsOn.length > 0) {
            for (let j = 0; j < resources[i].dependsOn.length; ++j) {
                const dependsOnCategory = resources[i].dependsOn[j].category;
                const dependsOnResourceName = resources[i].dependsOn[j].resourceName;
                if (amplifyMeta[dependsOnCategory] &&
                    (!((_a = amplifyMeta[dependsOnCategory][dependsOnResourceName]) === null || _a === void 0 ? void 0 : _a.lastPushTimeStamp) ||
                        !currentAmplifyMeta[dependsOnCategory] ||
                        !currentAmplifyMeta[dependsOnCategory][dependsOnResourceName]) &&
                    amplifyMeta[dependsOnCategory][dependsOnResourceName] &&
                    ((_b = amplifyMeta[dependsOnCategory][dependsOnResourceName]) === null || _b === void 0 ? void 0 : _b.serviceType) !== 'imported' &&
                    !resources.includes(amplifyMeta[dependsOnCategory][dependsOnResourceName])) {
                    resources.push(amplifyMeta[dependsOnCategory][dependsOnResourceName]);
                }
            }
        }
    }
    return lodash_1.default.uniqWith(resources, lodash_1.default.isEqual);
};
exports.getResourcesToBeCreated = getResourcesToBeCreated;
const getResourcesToBeDeleted = (amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources) => {
    let resources = [];
    Object.keys(currentAmplifyMeta).forEach((categoryName) => {
        const categoryItem = currentAmplifyMeta[categoryName];
        Object.keys(categoryItem).forEach((resource) => {
            if ((!amplifyMeta[categoryName] || !amplifyMeta[categoryName][resource]) && categoryItem[resource].serviceType !== 'imported') {
                currentAmplifyMeta[categoryName][resource].resourceName = resource;
                currentAmplifyMeta[categoryName][resource].category = categoryName;
                resources.push(currentAmplifyMeta[categoryName][resource]);
            }
        });
    });
    resources = filterResources(resources, filteredResources);
    if (category !== undefined && resourceName !== undefined) {
        resources = resources.filter((resource) => resource.category === category && resource.resourceName === resourceName);
    }
    if (category !== undefined && !resourceName) {
        resources = resources.filter((resource) => resource.category === category);
    }
    return resources;
};
exports.getResourcesToBeDeleted = getResourcesToBeDeleted;
const isBackendConfigModifiedSinceLastPush = (categoryName, resourceName, backendConfigs) => {
    var _a, _b;
    if (backendConfigs.backendConfig && backendConfigs.currentBackendConfig) {
        const deployedCategoryBackendConfig = categoryName in backendConfigs.currentBackendConfig ? backendConfigs.currentBackendConfig[categoryName] : undefined;
        const categoryBackendConfig = categoryName in backendConfigs.backendConfig ? backendConfigs.backendConfig[categoryName] : undefined;
        const deployedResource = deployedCategoryBackendConfig ? deployedCategoryBackendConfig[resourceName] : undefined;
        const categoryResource = categoryBackendConfig ? categoryBackendConfig[resourceName] : undefined;
        if (deployedResource && categoryResource) {
            return JSON.stringify(deployedResource).normalize() !== JSON.stringify(categoryResource).normalize();
        }
        if (categoryResource) {
            return true;
        }
        return false;
    }
    return !!((_b = (_a = backendConfigs.backendConfig) === null || _a === void 0 ? void 0 : _a[categoryName]) === null || _b === void 0 ? void 0 : _b[resourceName]);
};
const getResourcesToBeUpdated = async (amplifyMeta, currentAmplifyMeta, backendConfigs, category, resourceName, filteredResources) => {
    let resources = [];
    await asyncForEach(Object.keys(amplifyMeta), async (categoryName) => {
        const categoryItem = amplifyMeta[categoryName];
        await asyncForEach(Object.keys(categoryItem), async (resource) => {
            var _a, _b;
            if (categoryName === 'analytics') {
                (0, remove_pinpoint_policy_1.removeGetUserEndpoints)(resource);
            }
            if (currentAmplifyMeta[categoryName] &&
                currentAmplifyMeta[categoryName][resource] !== undefined &&
                amplifyMeta[categoryName] &&
                amplifyMeta[categoryName][resource] !== undefined &&
                amplifyMeta[categoryName][resource].serviceType !== 'imported') {
                if (categoryName === 'function' && currentAmplifyMeta[categoryName][resource].service === "LambdaLayer") {
                    const backendModified = await isBackendDirModifiedSinceLastPush(resource, categoryName, (_a = currentAmplifyMeta[categoryName][resource]) === null || _a === void 0 ? void 0 : _a.lastPushTimeStamp, amplify_category_function_1.hashLayerResource);
                    if (backendModified) {
                        amplifyMeta[categoryName][resource].resourceName = resource;
                        amplifyMeta[categoryName][resource].category = categoryName;
                        resources.push(amplifyMeta[categoryName][resource]);
                    }
                }
                else {
                    const backendConfigModified = isBackendConfigModifiedSinceLastPush(categoryName, resource, backendConfigs);
                    const backendModified = backendConfigModified ||
                        (await isBackendDirModifiedSinceLastPush(resource, categoryName, (_b = currentAmplifyMeta[categoryName][resource]) === null || _b === void 0 ? void 0 : _b.lastPushTimeStamp, exports.getHashForResourceDir));
                    if (backendModified) {
                        amplifyMeta[categoryName][resource].resourceName = resource;
                        amplifyMeta[categoryName][resource].category = categoryName;
                        resources.push(amplifyMeta[categoryName][resource]);
                    }
                    if (categoryName === 'hosting' && currentAmplifyMeta[categoryName][resource].service === 'ElasticContainer') {
                        const { frontend, [frontend]: { config: { SourceDir }, }, } = amplify_cli_core_1.stateManager.getProjectConfig();
                        const projectRootPath = amplify_cli_core_1.pathManager.findProjectRoot();
                        if (projectRootPath) {
                            const sourceAbsolutePath = path.join(projectRootPath, SourceDir);
                            const dockerFileHash = await (0, exports.getHashForResourceDir)(sourceAbsolutePath, [
                                'Dockerfile',
                                'docker-compose.yaml',
                                'docker-compose.yml',
                            ]);
                            if (currentAmplifyMeta[categoryName][resource].lastPushDirHash !== dockerFileHash) {
                                resources.push(amplifyMeta[categoryName][resource]);
                            }
                        }
                    }
                }
            }
        });
    });
    resources = filterResources(resources, filteredResources);
    if (category !== undefined && resourceName !== undefined) {
        resources = resources.filter((resource) => resource.category === category && resource.resourceName === resourceName);
    }
    if (category !== undefined && !resourceName) {
        resources = resources.filter((resource) => resource.category === category);
    }
    return resources;
};
exports.getResourcesToBeUpdated = getResourcesToBeUpdated;
const getResourcesToBeSynced = (amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources) => {
    let resources = [];
    Object.keys(amplifyMeta).forEach((categoryName) => {
        const categoryItem = amplifyMeta[categoryName];
        Object.keys(categoryItem)
            .filter((resource) => categoryItem[resource].serviceType === 'imported')
            .forEach((resource) => {
            if (lodash_1.default.get(currentAmplifyMeta, [categoryName, resource], undefined) === undefined &&
                lodash_1.default.get(amplifyMeta, [categoryName, resource], undefined) !== undefined) {
                amplifyMeta[categoryName][resource].resourceName = resource;
                amplifyMeta[categoryName][resource].category = categoryName;
                amplifyMeta[categoryName][resource].sync = 'import';
                resources.push(amplifyMeta[categoryName][resource]);
            }
            else if (lodash_1.default.get(currentAmplifyMeta, [categoryName, resource], undefined) !== undefined &&
                lodash_1.default.get(amplifyMeta, [categoryName, resource], undefined) === undefined) {
                amplifyMeta[categoryName][resource].resourceName = resource;
                amplifyMeta[categoryName][resource].category = categoryName;
                amplifyMeta[categoryName][resource].sync = 'unlink';
                resources.push(amplifyMeta[categoryName][resource]);
            }
            else if (lodash_1.default.get(currentAmplifyMeta, [categoryName, resource], undefined) !== undefined &&
                lodash_1.default.get(amplifyMeta, [categoryName, resource], undefined) !== undefined) {
                amplifyMeta[categoryName][resource].resourceName = resource;
                amplifyMeta[categoryName][resource].category = categoryName;
                amplifyMeta[categoryName][resource].sync = 'refresh';
                resources.push(amplifyMeta[categoryName][resource]);
            }
        });
    });
    Object.keys(currentAmplifyMeta).forEach((categoryName) => {
        const categoryItem = currentAmplifyMeta[categoryName];
        Object.keys(categoryItem)
            .filter((resource) => categoryItem[resource].serviceType === 'imported')
            .forEach((resource) => {
            if (lodash_1.default.get(currentAmplifyMeta, [categoryName, resource], undefined) !== undefined &&
                lodash_1.default.get(amplifyMeta, [categoryName, resource], undefined) === undefined) {
                currentAmplifyMeta[categoryName][resource].resourceName = resource;
                currentAmplifyMeta[categoryName][resource].category = categoryName;
                currentAmplifyMeta[categoryName][resource].sync = 'unlink';
                resources.push(currentAmplifyMeta[categoryName][resource]);
            }
        });
    });
    resources = filterResources(resources, filteredResources);
    if (category !== undefined && resourceName !== undefined) {
        resources = resources.filter((resource) => resource.category === category && resource.resourceName === resourceName);
    }
    if (category !== undefined && !resourceName) {
        resources = resources.filter((resource) => resource.category === category);
    }
    return resources;
};
exports.getResourcesToBeSynced = getResourcesToBeSynced;
const getAmplifyMeta = () => {
    const amplifyProjectInitStatus = (0, get_cloud_init_status_1.getCloudInitStatus)();
    if (amplifyProjectInitStatus === get_cloud_init_status_1.CLOUD_INITIALIZED) {
        return {
            amplifyMeta: amplify_cli_core_1.stateManager.getMeta(),
            currentAmplifyMeta: amplify_cli_core_1.stateManager.getCurrentMeta(),
        };
    }
    if (amplifyProjectInitStatus === get_cloud_init_status_1.CLOUD_NOT_INITIALIZED) {
        return {
            amplifyMeta: amplify_cli_core_1.stateManager.getBackendConfig(),
            currentAmplifyMeta: {},
        };
    }
    throw (0, amplify_cli_core_1.projectNotInitializedError)();
};
exports.getAmplifyMeta = getAmplifyMeta;
const getLocalAndDeployedBackendConfig = () => {
    let currentBackendConfig;
    let backendConfig;
    try {
        currentBackendConfig = amplify_cli_core_1.stateManager.getCurrentBackendConfig();
    }
    catch (e) { }
    try {
        backendConfig = amplify_cli_core_1.stateManager.getBackendConfig();
    }
    catch (e) { }
    return {
        backendConfig,
        currentBackendConfig,
    };
};
exports.getLocalAndDeployedBackendConfig = getLocalAndDeployedBackendConfig;
const isBackendDirModifiedSinceLastPush = async (resourceName, category, lastPushTimeStamp, hashFunction) => {
    if (!lastPushTimeStamp) {
        return false;
    }
    const localBackendDir = path.normalize(path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), category, resourceName));
    const cloudBackendDir = path.normalize(path.join(amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath(), category, resourceName));
    if (!fs.existsSync(localBackendDir) || !fs.existsSync(cloudBackendDir)) {
        return false;
    }
    const localDirHash = await hashFunction(localBackendDir, resourceName);
    const cloudDirHash = await hashFunction(cloudBackendDir, resourceName);
    return localDirHash !== cloudDirHash;
};
const getHashForResourceDir = async (dirPath, files) => {
    const options = {
        folders: { exclude: ['.*', 'node_modules', 'test_coverage', 'dist', 'build'] },
        files: {
            include: files,
        },
    };
    return (0, folder_hash_1.hashElement)(dirPath, options).then((result) => result.hash);
};
exports.getHashForResourceDir = getHashForResourceDir;
const filterResources = (resources, filteredResources) => {
    if (!filteredResources) {
        return resources;
    }
    resources = resources.filter((resource) => {
        let common = false;
        for (let i = 0; i < filteredResources.length; ++i) {
            if (filteredResources[i].category === resource.category && filteredResources[i].resourceName === resource.resourceName) {
                common = true;
                break;
            }
        }
        return common;
    });
    return resources;
};
const resourceBelongsToCategoryList = (category, categoryList) => {
    if (typeof category === 'string') {
        return categoryList.includes(category);
    }
    return false;
};
const filterResourceCategory = (resourceList, categoryList) => resourceList ? resourceList.filter((resource) => resourceBelongsToCategoryList(resource.category, categoryList)) : [];
const getResourceService = (category, resourceName) => {
    var _a;
    const { amplifyMeta } = (0, exports.getAmplifyMeta)();
    const categoryMeta = amplifyMeta ? amplifyMeta[category] : {};
    return (_a = categoryMeta[resourceName]) === null || _a === void 0 ? void 0 : _a.service;
};
exports.getResourceService = getResourceService;
const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; ++index) {
        await callback(array[index], index, array);
    }
};
//# sourceMappingURL=resource-status-data.js.map