"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.removeWalkthrough = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const constants_1 = require("../../../constants");
const layerCloudState_1 = require("../utils/layerCloudState");
const layerConfiguration_1 = require("../utils/layerConfiguration");
const layerHelpers_1 = require("../utils/layerHelpers");
const loadFunctionParameters_1 = require("../utils/loadFunctionParameters");
const storeResources_1 = require("../utils/storeResources");
const removeLayerQuestion = 'Choose the Layer versions you want to remove.';
async function removeWalkthrough(context, layerName) {
    const layerCloudState = layerCloudState_1.LayerCloudState.getInstance(layerName);
    const layerVersionList = await layerCloudState.getLayerVersionsFromCloud(context, layerName);
    if (layerVersionList.length === 0) {
        return layerName;
    }
    const lambdaFunctionsDependentOnLayer = (0, layerHelpers_1.getLambdaFunctionsDependentOnLayerFromMeta)(layerName, amplify_cli_core_1.stateManager.getMeta());
    disablePinnedVersions(lambdaFunctionsDependentOnLayer, layerName, layerVersionList);
    const { versions } = await inquirer_1.default.prompt(question(layerVersionList));
    const selectedLayerVersion = versions;
    if (selectedLayerVersion.length === 0) {
        return undefined;
    }
    const legacyLayerSelectedVersions = selectedLayerVersion.filter((r) => r.legacyLayer);
    const newLayerSelectedVersions = selectedLayerVersion.filter((r) => !r.legacyLayer);
    if (layerVersionList.length === newLayerSelectedVersions.length && legacyLayerSelectedVersions.length === 0) {
        return layerName;
    }
    context.print.info('Layer versions marked for deletion:');
    selectedLayerVersion.forEach((version) => {
        context.print.info(`- ${version.Version} | Description: ${version.Description || ''}`);
    });
    warnLegacyRemoval(context, legacyLayerSelectedVersions, newLayerSelectedVersions);
    const totalSelectedVersionsToRemove = newLayerSelectedVersions.length + legacyLayerSelectedVersions.length;
    if (legacyLayerSelectedVersions.length > 0) {
        await deleteLayerVersionsWithSdk(context, (0, layerHelpers_1.getLayerName)(context, layerName), legacyLayerSelectedVersions.map((r) => r.Version));
    }
    if (layerVersionList.length > totalSelectedVersionsToRemove) {
        if (newLayerSelectedVersions.length > 0) {
            const { envName } = amplify_cli_core_1.stateManager.getLocalEnvInfo();
            (0, layerConfiguration_1.saveLayerVersionsToBeRemovedByCfn)(layerName, newLayerSelectedVersions.map((r) => r.Version), envName);
        }
        const layerParameters = (0, layerHelpers_1.loadStoredLayerParameters)(context, layerName);
        await (0, storeResources_1.updateLayerArtifacts)(context, layerParameters, {
            generateCfnFile: true,
            updateDescription: false,
            updateLayerParams: false,
            updateMeta: false,
        });
        return undefined;
    }
    return layerName;
}
exports.removeWalkthrough = removeWalkthrough;
function warnLegacyRemoval(context, legacyLayerVersions, newLayerVersions) {
    const amplifyPush = chalk_1.default.green('amplify push');
    const legacyVersions = legacyLayerVersions.map((r) => r.Version);
    if (legacyLayerVersions.length > 0 && newLayerVersions.length > 0) {
        context.print.warning(`Warning: By continuing, these layer versions [${legacyVersions.join(', ')}] will be immediately deleted. All other layer versions will be deleted on ${amplifyPush}.`);
    }
    else if (legacyLayerVersions.length > 0) {
        context.print.warning(`Warning: By continuing, these layer versions [${legacyVersions.join(', ')}] will be immediately deleted.`);
    }
    else if (newLayerVersions.length > 0) {
        context.print.warning(`Layer versions will be deleted on ${amplifyPush}.`);
    }
    context.print.warning(`All new layer versions created with the Amplify CLI will only be deleted on ${amplifyPush}.`);
    context.print.info('');
}
async function deleteLayerVersionsWithSdk(context, layerName, versions) {
    var _a;
    const providerPlugin = await (_a = context.amplify.getProviderPlugins(context).awscloudformation, Promise.resolve().then(() => __importStar(require(_a))));
    const lambdaClient = await providerPlugin.getLambdaSdk(context);
    const spinner = (0, ora_1.default)('Deleting layer version from the cloud...').start();
    try {
        await lambdaClient.deleteLayerVersions(layerName, versions);
        spinner.succeed('Layers deleted');
    }
    catch (ex) {
        spinner.fail('Failed deleting');
        throw ex;
    }
    finally {
        spinner.stop();
    }
}
function disablePinnedVersions(lambdaFunctionsDependentOnLayer, layerName, layerVersionList) {
    lambdaFunctionsDependentOnLayer.forEach(([lambdaFunctionName]) => {
        const { lambdaLayers: lambdaLayerDependencies } = (0, loadFunctionParameters_1.loadFunctionParameters)(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_1.categoryName, lambdaFunctionName));
        lambdaLayerDependencies.forEach((layerDependency) => {
            if (layerDependency.resourceName === layerName && layerDependency.isLatestVersionSelected === false) {
                for (const layerVersion of layerVersionList) {
                    if (layerVersion.Version === layerDependency.version) {
                        layerVersion.pinnedByFunctions || (layerVersion.pinnedByFunctions = []);
                        layerVersion.pinnedByFunctions.push(lambdaFunctionName);
                        break;
                    }
                }
            }
        });
    });
}
const question = (layerVersionList) => [
    {
        name: 'versions',
        message: removeLayerQuestion,
        type: 'checkbox',
        choices: layerVersionList
            .sort((versionA, versionB) => versionA.Version - versionB.Version)
            .map((version) => ({
            disabled: Array.isArray(version.pinnedByFunctions) && version.pinnedByFunctions.length > 0
                ? `Can't be removed. ${version.pinnedByFunctions.join(', ')} depend${version.pinnedByFunctions.length > 1 ? '' : 's'} on this version.`
                : false,
            name: `${version.Version}: ${version.Description}`,
            short: version.Version.toString(),
            value: version,
        })),
    },
];
//# sourceMappingURL=removeLayerWalkthrough.js.map