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
exports.removeResource = exports.forceRemoveResource = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const inquirer = __importStar(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const envResourceParams_1 = require("./envResourceParams");
const update_backend_config_1 = require("./update-backend-config");
async function forceRemoveResource(context, category, resourceName, resourceDir) {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    if (!amplifyMeta[category] || Object.keys(amplifyMeta[category]).length === 0) {
        amplify_prompts_1.printer.error('No resources added for this category');
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError('No resources added for this category'));
        (0, amplify_cli_core_1.exitOnNextTick)(1);
    }
    amplify_prompts_1.printer.info(`Removing resource ${resourceName}...`);
    let response;
    try {
        response = await deleteResourceFiles(context, category, resourceName, resourceDir, true);
    }
    catch (e) {
        amplify_prompts_1.printer.error('Unable to force removal of resource: error deleting files');
    }
    return response;
}
exports.forceRemoveResource = forceRemoveResource;
async function removeResource(context, category, resourceName, options = { headless: false }, resourceNameCallback) {
    var _a;
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    if (!amplifyMeta[category] ||
        Object.keys(amplifyMeta[category]).filter((r) => amplifyMeta[category][r].mobileHubMigrated !== true).length === 0) {
        amplify_prompts_1.printer.error('No resources added for this category');
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError('No resources added for this category'));
        (0, amplify_cli_core_1.exitOnNextTick)(1);
    }
    let enabledCategoryResources = Object.keys(amplifyMeta[category]).filter((r) => amplifyMeta[category][r].mobileHubMigrated !== true);
    if (resourceName) {
        if (!enabledCategoryResources.includes(resourceName)) {
            const errMessage = `Resource ${resourceName} has not been added to ${category}`;
            amplify_prompts_1.printer.error(errMessage);
            await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
            (0, amplify_cli_core_1.exitOnNextTick)(1);
        }
    }
    else {
        if (options.serviceSuffix) {
            enabledCategoryResources = enabledCategoryResources.map((resource) => {
                const service = lodash_1.default.get(amplifyMeta, [category, resource, 'service']);
                const suffix = lodash_1.default.get(options, ['serviceSuffix', service], '');
                return { name: `${resource} ${suffix}`, value: resource };
            });
        }
        const question = [
            {
                name: 'resource',
                message: 'Choose the resource you would want to remove',
                type: 'list',
                choices: enabledCategoryResources,
            },
        ];
        const answer = await inquirer.prompt(question);
        resourceName = answer.resource;
    }
    if (resourceNameCallback) {
        await resourceNameCallback(resourceName);
    }
    const resourceDir = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, category, resourceName);
    if (options.headless !== true) {
        amplify_prompts_1.printer.blankLine();
        const service = lodash_1.default.get(amplifyMeta, [category, resourceName, 'service']);
        const serviceType = lodash_1.default.get(amplifyMeta, [category, resourceName, 'serviceType']);
        if ((_a = options === null || options === void 0 ? void 0 : options.serviceDeletionInfo) === null || _a === void 0 ? void 0 : _a[service]) {
            amplify_prompts_1.printer.info(options.serviceDeletionInfo[service]);
        }
        const confirm = await (0, amplify_cli_core_1.promptConfirmationRemove)(context, serviceType);
        if (!confirm) {
            return undefined;
        }
    }
    try {
        return await deleteResourceFiles(context, category, resourceName, resourceDir);
    }
    catch (err) {
        if (err.stack) {
            amplify_prompts_1.printer.info(err.stack);
        }
        amplify_prompts_1.printer.error('An error occurred when removing the resources from the local directory');
        await context.usageData.emitError(err);
        process.exitCode = 1;
    }
    return undefined;
}
exports.removeResource = removeResource;
const deleteResourceFiles = async (context, category, resourceName, resourceDir, force = false) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    if (!force) {
        const { allResources } = await context.amplify.getResourceStatus();
        allResources.forEach((resourceItem) => {
            if (resourceItem.dependsOn) {
                resourceItem.dependsOn.forEach((dependsOnItem) => {
                    if (dependsOnItem.category === category && dependsOnItem.resourceName === resourceName) {
                        amplify_prompts_1.printer.error('Resource cannot be removed because it has a dependency on another resource');
                        amplify_prompts_1.printer.error(`Dependency: ${resourceItem.service} - ${resourceItem.resourceName}`);
                        const error = new Error('Resource cannot be removed because it has a dependency on another resource');
                        error.stack = undefined;
                        throw error;
                    }
                });
            }
        });
    }
    const serviceName = amplifyMeta[category][resourceName].service;
    const resourceValues = {
        service: serviceName,
        resourceName,
    };
    if (amplifyMeta[category][resourceName] !== undefined) {
        delete amplifyMeta[category][resourceName];
    }
    amplify_cli_core_1.stateManager.setMeta(undefined, amplifyMeta);
    context.filesystem.remove(resourceDir);
    (0, envResourceParams_1.removeResourceParameters)(context, category, resourceName);
    (0, update_backend_config_1.updateBackendConfigAfterResourceRemove)(category, resourceName);
    amplify_prompts_1.printer.success('Successfully removed resource');
    return resourceValues;
};
//# sourceMappingURL=remove-resource.js.map