"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lambdaLayerNewVersionWalkthrough = exports.updateLayerWalkthrough = exports.createLayerWalkthrough = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const inquirer_1 = __importDefault(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const functionPluginLoader_1 = require("../utils/functionPluginLoader");
const layerCloudState_1 = require("../utils/layerCloudState");
const layerConfiguration_1 = require("../utils/layerConfiguration");
const layerHelpers_1 = require("../utils/layerHelpers");
const layerMigrationUtils_1 = require("../utils/layerMigrationUtils");
const layerParams_1 = require("../utils/layerParams");
async function createLayerWalkthrough(context, parameters = {}) {
    const projectName = context.amplify
        .getProjectDetails()
        .projectConfig.projectName.toLowerCase()
        .replace(/[^a-zA-Z0-9]/gi, '');
    const { layerName } = await inquirer_1.default.prompt((0, layerHelpers_1.layerNameQuestion)(projectName));
    parameters.layerName = `${projectName}${layerName}`;
    const runtimeReturn = await (0, functionPluginLoader_1.runtimeWalkthrough)(context, parameters);
    parameters.runtimes = runtimeReturn.map((val) => {
        var _a, _b;
        return ({
            name: val.runtime.name,
            value: val.runtime.value,
            layerExecutablePath: val.runtime.layerExecutablePath,
            cloudTemplateValues: [val.runtime.cloudTemplateValue],
            layerDefaultFiles: (_b = (_a = val.runtime) === null || _a === void 0 ? void 0 : _a.layerDefaultFiles) !== null && _b !== void 0 ? _b : [],
            runtimePluginId: val.runtimePluginId,
        });
    });
    const layerInputParameters = {};
    lodash_1.default.assign(layerInputParameters, await inquirer_1.default.prompt((0, layerHelpers_1.layerPermissionsQuestion)()));
    for (const permission of layerInputParameters.layerPermissions) {
        switch (permission) {
            case layerParams_1.PermissionEnum.AwsAccounts:
                layerInputParameters.accountIds = await (0, layerHelpers_1.layerAccountAccessPrompt)();
                break;
            case layerParams_1.PermissionEnum.AwsOrg:
                layerInputParameters.orgIds = await (0, layerHelpers_1.layerOrgAccessPrompt)();
                break;
        }
    }
    parameters.permissions = (0, layerHelpers_1.layerInputParamsToLayerPermissionArray)(layerInputParameters);
    parameters.build = true;
    return parameters;
}
exports.createLayerWalkthrough = createLayerWalkthrough;
async function updateLayerWalkthrough(context, lambdaToUpdate, parameters) {
    const { allResources } = await context.amplify.getResourceStatus();
    const resources = allResources
        .filter((resource) => resource.service === "LambdaLayer")
        .map((resource) => resource.resourceName);
    if (resources.length === 0) {
        const errMessage = 'No Lambda layer resource to update. Please use "amplify add function" to create a new Layer';
        context.print.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    if (resources.length === 1) {
        parameters.layerName = resources[0];
    }
    else if (lambdaToUpdate && resources.includes(lambdaToUpdate)) {
        parameters.layerName = lambdaToUpdate;
    }
    else {
        const resourceQuestion = [
            {
                name: 'resourceName',
                message: 'Select the Lambda layer to update:',
                type: 'list',
                choices: resources,
            },
        ];
        const resourceAnswer = await inquirer_1.default.prompt(resourceQuestion);
        parameters.layerName = resourceAnswer.resourceName;
    }
    const hasMigrated = await (0, layerMigrationUtils_1.migrateLegacyLayer)(context, parameters.layerName);
    const layerHasDeployed = (0, layerHelpers_1.loadPreviousLayerHash)(parameters.layerName) !== undefined;
    let permissionsUpdateConfirmed = false;
    const storedLayerParameters = (0, layerHelpers_1.loadStoredLayerParameters)(context, parameters.layerName);
    let { permissions } = storedLayerParameters;
    if (await context.amplify.confirmPrompt('Do you want to adjust layer version permissions?', true)) {
        permissionsUpdateConfirmed = true;
        let defaultOrgs = [];
        let defaultAccounts = [];
        let selectedVersionNumber;
        if (layerHasDeployed) {
            const layerCloudState = layerCloudState_1.LayerCloudState.getInstance(parameters.layerName);
            const layerVersions = await layerCloudState.getLayerVersionsFromCloud(context, parameters.layerName);
            const latestVersionText = 'Future layer versions';
            const layerVersionChoices = [
                latestVersionText,
                ...layerVersions.map((layerVersionMetadata) => `${layerVersionMetadata.Version}: ${layerVersionMetadata.Description}`),
            ];
            const selectedVersion = (await inquirer_1.default.prompt((0, layerHelpers_1.layerVersionQuestion)(layerVersionChoices, 'Select the layer version to update:'))).versionSelection;
            if (selectedVersion !== latestVersionText) {
                selectedVersionNumber = Number(lodash_1.default.first(selectedVersion.split(':')));
                parameters.selectedVersion = lodash_1.default.first(layerVersions.filter((version) => version.Version === selectedVersionNumber));
                permissions = parameters.selectedVersion.permissions;
            }
        }
        const defaultLayerPermissions = permissions.map((permission) => permission.type);
        defaultOrgs = permissions
            .filter((p) => p.type === layerParams_1.PermissionEnum.AwsOrg)
            .reduce((orgs, permission) => [...orgs, ...permission.orgs], []);
        defaultAccounts = permissions
            .filter((p) => p.type === layerParams_1.PermissionEnum.AwsAccounts)
            .reduce((accounts, permission) => [...accounts, ...permission.accounts], []);
        const layerInputParameters = await inquirer_1.default.prompt((0, layerHelpers_1.layerPermissionsQuestion)(defaultLayerPermissions));
        for (const permission of layerInputParameters.layerPermissions) {
            switch (permission) {
                case layerParams_1.PermissionEnum.AwsAccounts:
                    layerInputParameters.accountIds = await (0, layerHelpers_1.layerAccountAccessPrompt)(defaultAccounts);
                    break;
                case layerParams_1.PermissionEnum.AwsOrg:
                    layerInputParameters.orgIds = await (0, layerHelpers_1.layerOrgAccessPrompt)(defaultOrgs);
                    break;
            }
        }
        parameters.permissions = (0, layerHelpers_1.layerInputParamsToLayerPermissionArray)(layerInputParameters);
        if (selectedVersionNumber) {
            const { envName } = context.amplify.getEnvInfo();
            (0, layerConfiguration_1.saveLayerVersionPermissionsToBeUpdatedInCfn)(parameters.layerName, envName, selectedVersionNumber, parameters.permissions);
        }
    }
    const resourceUpdated = permissionsUpdateConfirmed && !lodash_1.default.isEqual(permissions, parameters.permissions);
    if (hasMigrated && parameters.permissions === undefined) {
        parameters.permissions = permissions;
    }
    parameters.runtimes = storedLayerParameters.runtimes;
    parameters.build = true;
    return { parameters, resourceUpdated };
}
exports.updateLayerWalkthrough = updateLayerWalkthrough;
async function lambdaLayerNewVersionWalkthrough(params, timestampString) {
    const changeLayerPermissions = await inquirer_1.default.prompt((0, layerHelpers_1.previousPermissionsQuestion)());
    let permissions = params.permissions;
    if (!changeLayerPermissions.usePreviousPermissions) {
        permissions = [layerParams_1.defaultLayerPermission];
    }
    const description = await descriptionQuestion(timestampString);
    return {
        ...params,
        permissions,
        description,
    };
}
exports.lambdaLayerNewVersionWalkthrough = lambdaLayerNewVersionWalkthrough;
async function descriptionQuestion(timestampString) {
    const response = await inquirer_1.default.prompt({
        name: 'description',
        default: `${'Updated layer version'} ${timestampString}`,
        message: 'Description:',
        validate: (desc) => {
            if (desc.length === 0)
                return 'Description cannot be empty';
            if (desc.length > 256)
                return 'Description cannot be more than 256 characters';
            return true;
        },
    });
    return response.description;
}
//# sourceMappingURL=lambdaLayerWalkthrough.js.map