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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPlugin = void 0;
var path = __importStar(require("path"));
var fs = __importStar(require("fs-extra"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
function verifyPlugin(pluginDirPath) {
    if (fs.existsSync(pluginDirPath) && fs.statSync(pluginDirPath).isDirectory()) {
        return verifyNodePackage(pluginDirPath);
    }
    return false;
}
exports.verifyPlugin = verifyPlugin;
function verifyNodePackage(pluginDirPath) {
    var pluginPackageJsonFilePath = path.join(pluginDirPath, 'package.json');
    if (!fs.existsSync(pluginPackageJsonFilePath) || !fs.statSync(pluginPackageJsonFilePath).isFile()) {
        return false;
    }
    try {
        fs.readFileSync(pluginPackageJsonFilePath); //package.json needs to be valid json file
        var pluginModule = require(pluginDirPath);
        return verifyAmplifyManifest(pluginDirPath, pluginModule);
    }
    catch (err) {
        return false;
    }
}
function verifyAmplifyManifest(pluginDirPath, pluginModule) {
    var pluginManifestFilePath = path.join(pluginDirPath, 'amplify-plugin.json');
    if (!fs.existsSync(pluginManifestFilePath) || !fs.statSync(pluginManifestFilePath).isFile()) {
        return false;
    }
    try {
        var manifest = (0, amplify_e2e_core_1.readJsonFile)(pluginManifestFilePath);
        return verifyEventHandlers(manifest, pluginModule);
    }
    catch (err) {
        false;
    }
    return undefined;
}
function verifyEventHandlers(manifest, pluginModule) {
    var isVerified = true;
    if (manifest.eventHandlers && manifest.eventHandlers.length > 0) {
        isVerified =
            Object.prototype.hasOwnProperty.call(pluginModule, 'handleAmplifyEvent') && typeof pluginModule['handleAmplifyEvent'] === 'function';
    }
    return isVerified;
}
//# sourceMappingURL=verifyPluginStructure.js.map