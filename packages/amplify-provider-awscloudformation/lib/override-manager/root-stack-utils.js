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
exports.isRootOverrideFileModifiedSinceLastPush = exports.isMigrateProject = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const __1 = require("..");
const isMigrateProject = () => {
    const projRoot = amplify_cli_core_1.pathManager.findProjectRoot();
    const buildProviderPath = amplify_cli_core_1.pathManager.getRootStackBuildDirPath(projRoot);
    if (fs.existsSync(buildProviderPath) && fs.existsSync(path.join(buildProviderPath, __1.rootStackFileName))) {
        return false;
    }
    else {
        return true;
    }
};
exports.isMigrateProject = isMigrateProject;
const isRootOverrideFileModifiedSinceLastPush = () => {
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    const localBackendDir = amplify_cli_core_1.pathManager.getRootStackBuildDirPath(projectPath);
    const cloudBackendDir = amplify_cli_core_1.pathManager.getCurrentCloudRootStackDirPath(projectPath);
    if (fs.existsSync(localBackendDir) && fs.existsSync(path.join(localBackendDir, '..', 'override.ts'))) {
        const localCfnBuffer = fs.readFileSync(path.join(localBackendDir, '..', 'override.ts'));
        if (fs.existsSync(cloudBackendDir) && fs.existsSync(path.join(cloudBackendDir, '..', 'override.ts'))) {
            const cloudCfnBuffer = fs.readFileSync(path.join(cloudBackendDir, '..', 'override.ts'));
            return !localCfnBuffer.equals(cloudCfnBuffer);
        }
        else {
            return true;
        }
    }
    else {
        return false;
    }
};
exports.isRootOverrideFileModifiedSinceLastPush = isRootOverrideFileModifiedSinceLastPush;
//# sourceMappingURL=root-stack-utils.js.map