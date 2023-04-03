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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validPluginName = exports.verifyPlugin = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const amplify_cli_core_1 = require("amplify-cli-core");
async function verifyPlugin(pluginDirPath) {
    let exists = await fs.pathExists(pluginDirPath);
    if (exists) {
        const stat = await fs.stat(pluginDirPath);
        if (!stat.isDirectory()) {
            exists = false;
        }
    }
    if (exists) {
        return verifyNodePackage(pluginDirPath);
    }
    return new amplify_cli_core_1.PluginVerificationResult(false, amplify_cli_core_1.PluginVerificationError.PluginDirPathNotExist);
}
exports.verifyPlugin = verifyPlugin;
async function validPluginName(pluginName) {
    const result = {
        isValid: true,
    };
    const corePluginJson = amplify_cli_core_1.JSONUtilities.readJson(path.normalize(path.join(__dirname, '..', '..', 'amplify-plugin.json')));
    if (corePluginJson && corePluginJson.commands && corePluginJson.commands.includes(pluginName)) {
        result.isValid = false;
        result.message = 'Amplify CLI core command names can not be used as plugin name';
    }
    return result;
}
exports.validPluginName = validPluginName;
async function verifyNodePackage(pluginDirPath) {
    const pluginPackageJsonFilePath = path.join(pluginDirPath, amplify_cli_core_1.constants.PACKAGEJSON_FILE_NAME);
    try {
        const packageJson = amplify_cli_core_1.JSONUtilities.readJson(pluginPackageJsonFilePath);
        const context = {
            pluginDirPath,
        };
        const result = await verifyAmplifyManifest(context);
        result.packageJson = packageJson;
        return result;
    }
    catch (err) {
        return new amplify_cli_core_1.PluginVerificationResult(false, amplify_cli_core_1.PluginVerificationError.InvalidNodePackage, err);
    }
}
async function verifyAmplifyManifest(context) {
    const pluginManifestFilePath = path.join(context.pluginDirPath, amplify_cli_core_1.constants.MANIFEST_FILE_NAME);
    let exists = await fs.pathExists(pluginManifestFilePath);
    if (exists) {
        const stat = await fs.stat(pluginManifestFilePath);
        exists = stat.isFile();
    }
    if (!exists) {
        return new amplify_cli_core_1.PluginVerificationResult(false, amplify_cli_core_1.PluginVerificationError.MissingManifest);
    }
    try {
        const manifest = amplify_cli_core_1.JSONUtilities.readJson(pluginManifestFilePath);
        const pluginNameValidationResult = await validPluginName(manifest.name);
        if (pluginNameValidationResult.isValid) {
            context.manifest = manifest;
            let result = verifyCommands();
            result = result.verified ? await verifyEventHandlers(context) : result;
            result.manifest = manifest;
            return result;
        }
        return new amplify_cli_core_1.PluginVerificationResult(false, amplify_cli_core_1.PluginVerificationError.InvalidManifest, pluginNameValidationResult.message);
    }
    catch (err) {
        return new amplify_cli_core_1.PluginVerificationResult(false, amplify_cli_core_1.PluginVerificationError.InvalidManifest, err);
    }
}
function verifyCommands() {
    return new amplify_cli_core_1.PluginVerificationResult(true);
}
async function verifyEventHandlers(context) {
    var _a;
    let isVerified = true;
    if (context.manifest.eventHandlers && context.manifest.eventHandlers.length > 0) {
        if (!context.pluginModule) {
            context.pluginModule = await Promise.resolve().then(() => __importStar(require(context.pluginDirPath)));
        }
        isVerified =
            Object.prototype.hasOwnProperty.call(context.pluginModule, amplify_cli_core_1.constants.HANDLE_AMPLIFY_EVENT) &&
                typeof ((_a = context.pluginModule) === null || _a === void 0 ? void 0 : _a[amplify_cli_core_1.constants.HANDLE_AMPLIFY_EVENT]) === 'function';
    }
    if (isVerified) {
        return new amplify_cli_core_1.PluginVerificationResult(true);
    }
    return new amplify_cli_core_1.PluginVerificationResult(false, amplify_cli_core_1.PluginVerificationError.MissingHandleAmplifyEventMethod);
}
//# sourceMappingURL=verify-plugin.js.map