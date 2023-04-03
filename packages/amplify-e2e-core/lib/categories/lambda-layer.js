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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntimeDisplayNames = exports.getLayerVersionArnFromCfn = exports.LayerPermissionName = exports.addOptData = exports.updateOptData = exports.updateLayer = exports.removeLayerVersion = exports.removeLayer = exports.addLayer = exports.getCurrentLayerArnFromMeta = exports.validateLayerMetadata = exports.expectDeployedLayerDescription = exports.expectEphemeralDataIsUndefined = exports.expectEphemeralPermissions = exports.validatePushedVersion = exports.getLayerDirectoryName = exports.validateLayerDir = exports.permissionChoices = exports.layerRuntimeChoices = void 0;
/* eslint-disable import/no-cycle */
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const __1 = require("..");
const utils_1 = require("../utils");
const sdk_calls_1 = require("../utils/sdk-calls");
const selectors_1 = require("../utils/selectors");
exports.layerRuntimeChoices = ['NodeJS', 'Python'];
exports.permissionChoices = [
    'Specific AWS accounts',
    'Specific AWS organization',
    'Public (Anyone on AWS can use this layer)',
];
const PARAMETERS_FILE_NAME = 'parameters.json';
/**
 * validate layer directory
 */
const validateLayerDir = (projectRoot, layerProjectName, runtimes) => {
    const layerDir = path.join(projectRoot, 'amplify', 'backend', 'function', (0, exports.getLayerDirectoryName)(layerProjectName));
    const validDir = fs.pathExistsSync(path.join(layerDir, 'opt'));
    if (runtimes && runtimes.length) {
        for (const runtime of runtimes) {
            if (!fs.pathExistsSync(path.join(layerDir, getLayerRuntimeInfo(runtime).runtimePath))) {
                return false;
            }
        }
    }
    return validDir;
};
exports.validateLayerDir = validateLayerDir;
/**
 * get the name of a layer directory
 */
const getLayerDirectoryName = ({ layerName, projName }) => `${projName}${layerName}`;
exports.getLayerDirectoryName = getLayerDirectoryName;
/**
 * validation helper for layer version
 */
const validatePushedVersion = (projectRoot, layerProjectName, permissions) => {
    const layerData = getLayerConfig(projectRoot, (0, exports.getLayerDirectoryName)(layerProjectName));
    const storedPermissions = layerData.permissions;
    permissions.forEach((perm) => expect(storedPermissions).toContainEqual(perm));
};
exports.validatePushedVersion = validatePushedVersion;
/**
 * validation helper for ephemeral layer version permissions
 */
const expectEphemeralPermissions = (projectRoot, layerProjectName, envName, version, permissions) => {
    var _a, _b, _c;
    const layerData = getLayerConfig(projectRoot, (0, exports.getLayerDirectoryName)(layerProjectName));
    const storedPermissions = (_c = (_b = (_a = layerData === null || layerData === void 0 ? void 0 : layerData.ephemeral) === null || _a === void 0 ? void 0 : _a.layerVersionPermissionsToUpdate) === null || _b === void 0 ? void 0 : _b[envName]) === null || _c === void 0 ? void 0 : _c[version];
    permissions.forEach((perm) => expect(storedPermissions).toContainEqual(perm));
};
exports.expectEphemeralPermissions = expectEphemeralPermissions;
/**
 * validation helper for ephemeral data
 */
const expectEphemeralDataIsUndefined = (projectRoot, layerProjectName) => {
    const layerData = getLayerConfig(projectRoot, (0, exports.getLayerDirectoryName)(layerProjectName));
    const ephemeralData = layerData === null || layerData === void 0 ? void 0 : layerData.ephemeral;
    expect(ephemeralData).toBeUndefined();
};
exports.expectEphemeralDataIsUndefined = expectEphemeralDataIsUndefined;
/**
 * validation helper for layer version description
 */
const expectDeployedLayerDescription = (projectRoot, layerProjectName, meta, envName, layerDescription) => __awaiter(void 0, void 0, void 0, function* () {
    const arn = (0, exports.getCurrentLayerArnFromMeta)(projectRoot, layerProjectName);
    const region = meta.providers.awscloudformation.Region;
    const { description } = getLayerRuntimes(projectRoot, (0, exports.getLayerDirectoryName)(layerProjectName));
    expect(arn).toBeDefined();
    expect(description).toEqual(layerDescription);
    const { LayerVersions: Versions } = yield (0, sdk_calls_1.listVersions)(`${(0, exports.getLayerDirectoryName)(layerProjectName)}-${envName}`, region);
    expect(Versions).toBeDefined();
    expect(Versions).toHaveLength(1);
    expect(Versions[0].Description).toEqual(layerDescription);
});
exports.expectDeployedLayerDescription = expectDeployedLayerDescription;
/**
 * validation helper for Lambda layers
 */
const validateLayerMetadata = (projectRoot, layerProjectName, meta, envName, arns) => __awaiter(void 0, void 0, void 0, function* () {
    const arn = (0, exports.getCurrentLayerArnFromMeta)(projectRoot, layerProjectName);
    const region = meta.providers.awscloudformation.Region;
    const { runtimes } = getLayerRuntimes(projectRoot, (0, exports.getLayerDirectoryName)(layerProjectName));
    const runtimeValues = runtimes;
    expect(arn).toBeDefined();
    const cloudData = yield (0, sdk_calls_1.getLayerVersion)(arn, region);
    const { LayerVersions: Versions } = yield (0, sdk_calls_1.listVersions)(`${(0, exports.getLayerDirectoryName)(layerProjectName)}-${envName}`, region);
    const cloudVersions = Versions.map((version) => version.LayerVersionArn);
    expect(cloudVersions.map(String).sort()).toEqual(arns.sort());
    expect(cloudData.LayerVersionArn).toEqual(arn);
    expect(cloudData.CompatibleRuntimes).toEqual(runtimeValues);
});
exports.validateLayerMetadata = validateLayerMetadata;
/**
 * get arn from amplify-meta.json
 */
const getCurrentLayerArnFromMeta = (projectRoot, layerProjectName) => {
    const meta = (0, utils_1.getBackendAmplifyMeta)(projectRoot);
    const layerName = (0, exports.getLayerDirectoryName)(layerProjectName);
    return meta.function[layerName].output.Arn;
};
exports.getCurrentLayerArnFromMeta = getCurrentLayerArnFromMeta;
/**
 * add a Lambda layer resource via `amplify add function`
 */
const addLayer = (cwd, settings, testingWithLatestCodebase = false) => {
    const defaultSettings = {
        permissions: [],
    };
    // eslint-disable-next-line no-param-reassign
    settings = Object.assign(Object.assign({}, defaultSettings), settings);
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['add', 'function'], { cwd, stripColors: true })
            .wait('Select which capability you want to add:')
            .sendKeyDown()
            .sendCarriageReturn() // Layer
            .wait('Provide a name for your Lambda layer:')
            .sendLine(settings.layerName);
        const runtimeDisplayNames = (0, exports.getRuntimeDisplayNames)(settings.runtimes);
        expect(settings.runtimes.length === runtimeDisplayNames.length).toBe(true);
        chain.wait('Choose the runtime that you want to use:');
        (0, selectors_1.multiSelect)(chain, runtimeDisplayNames, exports.layerRuntimeChoices);
        chain.wait('The current AWS account will always have access to this layer.');
        (0, selectors_1.multiSelect)(chain, settings.permissions, exports.permissionChoices);
        if (settings.permissions.includes('Specific AWS accounts')) {
            chain.wait('Provide a list of comma-separated AWS account IDs:').sendLine(settings.accountId);
        }
        if (settings.permissions.includes('Specific AWS organization')) {
            chain.wait('Provide a list of comma-separated AWS organization IDs:').sendLine(settings.orgId);
        }
        waitForLayerSuccessPrintout(chain, settings, 'created');
        chain.run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
};
exports.addLayer = addLayer;
/**
 * Remove all layer versions via `amplify remove function`
 * Assumes first item in list of functions is a layer and removes it
 */
const removeLayer = (cwd, versionsToRemove, allVersions) => new Promise((resolve, reject) => {
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['remove', 'function'], { cwd, stripColors: true })
        .wait('Choose the resource you would want to remove')
        .sendCarriageReturn() // first one
        .wait('When you delete a layer version, you can no longer configure functions to use it.')
        .wait('However, any function that already uses the layer version continues to have access to it.')
        .wait('Choose the Layer versions you want to remove.');
    (0, selectors_1.multiSelect)(chain, versionsToRemove, allVersions);
    chain
        .wait('Are you sure you want to delete the resource? This action')
        .sendConfirmYes()
        .wait('Successfully removed resource')
        .sendEof()
        .run((err) => {
        if (!err) {
            resolve();
        }
        else {
            reject(err);
        }
    });
});
exports.removeLayer = removeLayer;
/**
 * remove layer version via `amplify remove function`
 * assumes first item in list of functions is a layer and removes it
 */
const removeLayerVersion = (cwd, settings, versionsToRemove, allVersions, testingWithLatestCodebase = false) => new Promise((resolve, reject) => {
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['remove', 'function'], { cwd, stripColors: true })
        .wait('Choose the resource you would want to remove')
        .sendCarriageReturn() // first one
        .wait('When you delete a layer version, you can no longer configure functions to use it.')
        .wait('However, any function that already uses the layer version continues to have access to it.')
        .wait('Choose the Layer versions you want to remove.');
    (0, selectors_1.multiSelect)(chain, versionsToRemove, allVersions);
    if (settings.removeLegacyOnly) {
        chain.wait(/Warning: By continuing, these layer versions \[.+\] will be immediately deleted./);
    }
    if (!settings.removeNoLayerVersions) {
        chain.wait('All new layer versions created with the Amplify CLI will only be deleted on amplify push.');
    }
    if (settings.removeLegacyOnly) {
        chain.wait('✔ Layers deleted');
    }
    chain.sendEof().run((err) => {
        if (!err) {
            resolve();
        }
        else {
            reject(err);
        }
    });
});
exports.removeLayerVersion = removeLayerVersion;
/**
 * update Lambda layer resource via `amplify update function`
 */
const updateLayer = (cwd, settings, testingWithLatestCodebase = false) => new Promise((resolve, reject) => {
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['update', 'function'], { cwd, stripColors: true });
    if (settings.numLayers > 1) {
        chain.wait('Select the Lambda layer to update:').sendCarriageReturn();
    }
    if (settings.migrateLegacyLayer === true) {
        chain
            .wait('Amplify updated the way Lambda layers work to better support team workflows and additional features.')
            .wait('Continue?')
            .sendConfirmYes();
    }
    chain.wait('Do you want to adjust layer version permissions?');
    // eslint-disable-next-line spellcheck/spell-checker
    if (settings.dontChangePermissions === true) {
        chain.sendConfirmNo();
    }
    else {
        chain.sendConfirmYes();
        // Compatibility with existing e2e tests
        if (settings.versions > 0) {
            chain
                .wait('Select the layer version to update')
                .sendKeyDown() // Move down from "future layer" option
                .sendCarriageReturn(); // assumes updating the latest layer version
        }
        else if (settings.changePermissionOnFutureVersion === true) {
            chain.wait('Select the layer version to update').sendCarriageReturn(); // future layer version
        }
        else if (settings.changePermissionOnLatestVersion === true) {
            chain
                .wait('Select the layer version to update')
                .sendKeyDown() // Move down from "future layer" option
                .sendCarriageReturn(); // latest layer version
        }
        chain.wait('The current AWS account will always have access to this layer.');
        (0, selectors_1.multiSelect)(chain, settings.permissions, exports.permissionChoices);
        waitForLayerSuccessPrintout(chain, settings, 'updated');
    }
    chain.run((err) => {
        if (!err) {
            resolve();
        }
        else {
            reject(err);
        }
    });
});
exports.updateLayer = updateLayer;
/**
 * append passed in data to opt/data.txt for the given Lambda layer resource
 */
const updateOptData = (projectRoot, layerProjectName, data) => {
    fs.appendFileSync(path.join(projectRoot, 'amplify', 'backend', 'function', (0, exports.getLayerDirectoryName)(layerProjectName), 'opt', 'data.txt'), data, 'utf8');
};
exports.updateOptData = updateOptData;
/**
 * write passed in data to opt/data.txt for the given Lambda layer resource
 */
const addOptData = (projectRoot, layerProjectName, data = 'data') => {
    fs.writeFileSync(path.join(projectRoot, 'amplify', 'backend', 'function', (0, exports.getLayerDirectoryName)(layerProjectName), 'opt', 'data.txt'), data, 'utf8');
};
exports.addOptData = addOptData;
/* eslint-disable @typescript-eslint/naming-convention */
/**
 * layer permission enum
 */
var LayerPermissionName;
(function (LayerPermissionName) {
    LayerPermissionName["awsAccounts"] = "awsAccounts";
    LayerPermissionName["awsOrg"] = "awsOrg";
    LayerPermissionName["private"] = "Private";
    LayerPermissionName["public"] = "Public";
})(LayerPermissionName = exports.LayerPermissionName || (exports.LayerPermissionName = {}));
/**
 * get Lambda layer version arn from the local CloudFormation template
 */
const getLayerVersionArnFromCfn = (projectRoot, layerProjectName) => {
    const directoryName = (0, exports.getLayerDirectoryName)(layerProjectName);
    const cfn = getLayerCfn(projectRoot, directoryName);
    const versionLogicalNames = Object.keys(cfn.Resources).filter((key) => cfn.Resources[key].Type === 'AWS::Lambda::LayerVersion');
    return versionLogicalNames;
};
exports.getLayerVersionArnFromCfn = getLayerVersionArnFromCfn;
const getLayerCfn = (projectRoot, layerDirectoryName) => {
    const cfnFilePath = path.join(projectRoot, 'amplify', layerDirectoryName, `${layerDirectoryName}-awscloudformation-template.json`);
    const cfn = amplify_cli_core_1.JSONUtilities.readJson(cfnFilePath);
    return cfn;
};
const getLayerConfig = (projectRoot, layerName) => {
    const layerConfigPath = path.join(projectRoot, 'amplify', 'backend', 'function', layerName, 'layer-configuration.json');
    const layerConfig = amplify_cli_core_1.JSONUtilities.readJson(layerConfigPath);
    return layerConfig;
};
const getLayerRuntimes = (projectRoot, layerName) => {
    const runtimesFilePath = path.join(projectRoot, 'amplify', 'backend', 'function', layerName, PARAMETERS_FILE_NAME);
    return amplify_cli_core_1.JSONUtilities.readJson(runtimesFilePath);
};
/**
 * map display names for runtimes
 */
const getRuntimeDisplayNames = (runtimes) => runtimes.map((runtime) => getLayerRuntimeInfo(runtime).displayName);
exports.getRuntimeDisplayNames = getRuntimeDisplayNames;
const getLayerRuntimeInfo = (runtime) => {
    switch (runtime) {
        case 'nodejs':
            return { displayName: 'NodeJS', runtimePath: path.join('lib', runtime) };
        case 'python':
            return { displayName: 'Python', runtimePath: path.join('lib', runtime) };
        default:
            throw new Error(`Invalid runtime value: ${runtime}`);
    }
};
const waitForLayerSuccessPrintout = (chain, settings, action) => {
    var _a;
    chain.wait(`✅ Lambda layer folders & files ${action}:`);
    if (((_a = settings === null || settings === void 0 ? void 0 : settings.runtimes) === null || _a === void 0 ? void 0 : _a.length) > 0) {
        chain
            .wait(path.join('amplify', 'backend', 'function', (settings.projName || '') + settings.layerName))
            .wait('Next steps:')
            .wait('Move your libraries to the following folder:');
        const runtimes = settings.layerName && settings.projName ? settings.runtimes : [];
        for (const runtime of runtimes) {
            const { displayName, runtimePath } = getLayerRuntimeInfo(runtime);
            const layerRuntimePathOutput = path.join('amplify', 'backend', 'function', `${settings.projName + settings.layerName}`, `${runtimePath}`);
            const layerRuntimeDirOutput = `[${displayName}]: ${layerRuntimePathOutput}`;
            chain.wait(layerRuntimeDirOutput);
        }
    }
    chain
        .wait('Include any files you want to share across runtimes in this folder:')
        .wait('"amplify function update <function-name>" - configure a function with this Lambda layer')
        .wait('"amplify push" - builds all of your local backend resources and provisions them in the cloud')
        .sendEof();
};
//# sourceMappingURL=lambda-layer.js.map