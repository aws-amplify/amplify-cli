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
exports.isRootStackModifiedSinceLastPush = exports.getHashForRootStack = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_provider_awscloudformation_1 = require("@aws-amplify/amplify-provider-awscloudformation");
const folder_hash_1 = require("folder-hash");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
function getHashForRootStack(dirPath, files) {
    const options = {
        files: {
            include: files,
        },
    };
    return (0, folder_hash_1.hashElement)(dirPath, options).then((result) => result.hash);
}
exports.getHashForRootStack = getHashForRootStack;
async function isRootStackModifiedSinceLastPush() {
    try {
        const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
        const localBackendDir = amplify_cli_core_1.pathManager.getRootStackBuildDirPath(projectPath);
        const cloudBackendDir = amplify_cli_core_1.pathManager.getCurrentCloudRootStackDirPath(projectPath);
        if (fs.existsSync(localBackendDir) && fs.existsSync(path.join(localBackendDir, amplify_provider_awscloudformation_1.rootStackFileName))) {
            const localCfnBuffer = fs.readFileSync(path.join(localBackendDir, amplify_provider_awscloudformation_1.rootStackFileName));
            if (fs.existsSync(cloudBackendDir) && fs.existsSync(path.join(cloudBackendDir, amplify_provider_awscloudformation_1.rootStackFileName))) {
                const cloudCfnBuffer = fs.readFileSync(path.join(cloudBackendDir, amplify_provider_awscloudformation_1.rootStackFileName));
                return !localCfnBuffer.equals(cloudCfnBuffer);
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }
    }
    catch (error) {
        throw new Error('Amplify Project not initialized.');
    }
}
exports.isRootStackModifiedSinceLastPush = isRootStackModifiedSinceLastPush;
//# sourceMappingURL=root-stack-status.js.map