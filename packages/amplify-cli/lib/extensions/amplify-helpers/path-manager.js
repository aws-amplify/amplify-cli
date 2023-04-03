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
exports.getCurrentAmplifyMetaFilePath = exports.getAmplifyMetaFilePath = exports.getCurrentBackendConfigFilePath = exports.getBackendConfigFilePath = exports.getProviderInfoFilePath = exports.getLocalEnvFilePath = exports.getProjectConfigFilePath = exports.getGitIgnoreFilePath = exports.getAmplifyRcFilePath = exports.getCurrentCloudBackendDirPath = exports.getBackendDirPath = exports.getDotConfigDirPath = exports.getAmplifyDirPath = exports.getHomeDotAmplifyDirPath = exports.searchProjectRootPath = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const os_1 = require("os");
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const projectPathValidate = (projectPath) => {
    if (fs.existsSync(projectPath)) {
        const amplifyDirPath = (0, exports.getAmplifyDirPath)(projectPath);
        const infoSubDirPath = (0, exports.getDotConfigDirPath)(projectPath);
        return fs.existsSync(amplifyDirPath) && fs.existsSync(infoSubDirPath);
    }
    return false;
};
const searchProjectRootPath = () => {
    let currentPath = process.cwd();
    do {
        if (projectPathValidate(currentPath)) {
            return currentPath;
        }
        const parentPath = path.dirname(currentPath);
        if (currentPath === parentPath) {
            return currentPath;
        }
        currentPath = parentPath;
    } while (true);
};
exports.searchProjectRootPath = searchProjectRootPath;
const getHomeDotAmplifyDirPath = () => path.join((0, os_1.homedir)(), constants_1.amplifyCLIConstants.DotAmplifyDirName);
exports.getHomeDotAmplifyDirPath = getHomeDotAmplifyDirPath;
const getAmplifyDirPath = (projectPath) => {
    if (!projectPath) {
        projectPath = (0, exports.searchProjectRootPath)();
    }
    if (projectPath) {
        return path.normalize(path.join(projectPath, constants_1.amplifyCLIConstants.AmplifyCLIDirName));
    }
    throw (0, amplify_cli_core_1.projectNotInitializedError)();
};
exports.getAmplifyDirPath = getAmplifyDirPath;
const getDotConfigDirPath = (projectPath) => path.normalize(path.join((0, exports.getAmplifyDirPath)(projectPath), constants_1.amplifyCLIConstants.DotConfigAmplifyCLISubDirName));
exports.getDotConfigDirPath = getDotConfigDirPath;
const getBackendDirPath = (projectPath) => path.normalize(path.join((0, exports.getAmplifyDirPath)(projectPath), constants_1.amplifyCLIConstants.BackendAmplifyCLISubDirName));
exports.getBackendDirPath = getBackendDirPath;
const getCurrentCloudBackendDirPath = (projectPath) => path.normalize(path.join((0, exports.getAmplifyDirPath)(projectPath), constants_1.amplifyCLIConstants.CurrentCloudBackendAmplifyCLISubDirName));
exports.getCurrentCloudBackendDirPath = getCurrentCloudBackendDirPath;
const getAmplifyRcFilePath = (projectPath) => {
    if (!projectPath) {
        projectPath = (0, exports.searchProjectRootPath)();
    }
    if (projectPath) {
        return path.normalize(path.join(projectPath, '.amplifyrc'));
    }
    throw (0, amplify_cli_core_1.projectNotInitializedError)();
};
exports.getAmplifyRcFilePath = getAmplifyRcFilePath;
const getGitIgnoreFilePath = (projectPath) => {
    if (!projectPath) {
        projectPath = (0, exports.searchProjectRootPath)();
    }
    if (projectPath) {
        return path.normalize(path.join(projectPath, '.gitignore'));
    }
    throw (0, amplify_cli_core_1.projectNotInitializedError)();
};
exports.getGitIgnoreFilePath = getGitIgnoreFilePath;
const getProjectConfigFilePath = (projectPath) => path.normalize(path.join((0, exports.getDotConfigDirPath)(projectPath), constants_1.amplifyCLIConstants.ProjectConfigFileName));
exports.getProjectConfigFilePath = getProjectConfigFilePath;
const getLocalEnvFilePath = (projectPath) => path.normalize(path.join((0, exports.getDotConfigDirPath)(projectPath), constants_1.amplifyCLIConstants.LocalEnvFileName));
exports.getLocalEnvFilePath = getLocalEnvFilePath;
const getProviderInfoFilePath = (projectPath) => path.normalize(path.join((0, exports.getAmplifyDirPath)(projectPath), constants_1.amplifyCLIConstants.ProviderInfoFileName));
exports.getProviderInfoFilePath = getProviderInfoFilePath;
const getBackendConfigFilePath = (projectPath) => path.normalize(path.join((0, exports.getBackendDirPath)(projectPath), constants_1.amplifyCLIConstants.BackendConfigFileName));
exports.getBackendConfigFilePath = getBackendConfigFilePath;
const getCurrentBackendConfigFilePath = (projectPath) => path.normalize(path.join((0, exports.getCurrentCloudBackendDirPath)(projectPath), constants_1.amplifyCLIConstants.BackendConfigFileName));
exports.getCurrentBackendConfigFilePath = getCurrentBackendConfigFilePath;
const getAmplifyMetaFilePath = (projectPath) => path.normalize(path.join((0, exports.getBackendDirPath)(projectPath), constants_1.amplifyCLIConstants.amplifyMetaFileName));
exports.getAmplifyMetaFilePath = getAmplifyMetaFilePath;
const getCurrentAmplifyMetaFilePath = (projectPath) => path.normalize(path.join((0, exports.getCurrentCloudBackendDirPath)(projectPath), constants_1.amplifyCLIConstants.amplifyMetaFileName));
exports.getCurrentAmplifyMetaFilePath = getCurrentAmplifyMetaFilePath;
//# sourceMappingURL=path-manager.js.map