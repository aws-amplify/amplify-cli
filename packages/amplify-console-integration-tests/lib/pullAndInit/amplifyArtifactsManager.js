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
exports.getProjectConfig = exports.getTeamProviderInfo = exports.checkAmplifyFolderStructure = exports.removeFilesForThirdParty = exports.removeFilesForTeam = exports.removeDotConfigDir = void 0;
var path = __importStar(require("path"));
var fs = __importStar(require("fs-extra"));
var util = __importStar(require("../util"));
var removeDotConfigDir = function (projectRootDirPath) {
    var amplifyDirPath = path.join(projectRootDirPath, 'amplify');
    var dotConfigDirPath = path.join(amplifyDirPath, '.config');
    fs.removeSync(dotConfigDirPath);
};
exports.removeDotConfigDir = removeDotConfigDir;
var removeFilesForTeam = function (projectRootDirPath) {
    var amplifyDirPath = path.join(projectRootDirPath, 'amplify');
    var dotConfigDirPath = path.join(amplifyDirPath, '.config');
    var files = fs.readdirSync(dotConfigDirPath);
    files.forEach(function (fileName) {
        if (fileName.includes('local')) {
            var filePath = path.join(dotConfigDirPath, fileName);
            fs.removeSync(filePath);
        }
    });
    var currentCloudBackendDirPath = path.join(amplifyDirPath, '#current-cloud-backend');
    var mockDataDirPath = path.join(amplifyDirPath, 'mock-data');
    var mockAPIResourcesDirPath = path.join(amplifyDirPath, 'mock-api-resources');
    fs.removeSync(mockAPIResourcesDirPath);
    fs.removeSync(mockDataDirPath);
    fs.removeSync(currentCloudBackendDirPath);
    var backendDirPath = path.join(amplifyDirPath, 'backend');
    var amplifyMetaFilePath = path.join(backendDirPath, 'amplify-meta.json');
    var awsCloudFormationDirPath = path.join(backendDirPath, 'awscloudformation');
    fs.removeSync(awsCloudFormationDirPath);
    fs.removeSync(amplifyMetaFilePath);
};
exports.removeFilesForTeam = removeFilesForTeam;
var removeFilesForThirdParty = function (projectRootDirPath) {
    (0, exports.removeFilesForTeam)(projectRootDirPath);
    removeTeamProviderInfo(projectRootDirPath);
};
exports.removeFilesForThirdParty = removeFilesForThirdParty;
var removeTeamProviderInfo = function (projectRootDirPath) {
    var teamProviderInfoFilePath = path.join(projectRootDirPath, 'amplify', 'team-provider-info.json');
    fs.removeSync(teamProviderInfoFilePath);
};
var checkAmplifyFolderStructure = function (projectRootDirPath) {
    var amplifyDirPath = path.join(projectRootDirPath, 'amplify');
    var teamProviderInfoFilePath = path.join(amplifyDirPath, 'team-provider-info.json');
    var dotConfigDirPath = path.join(amplifyDirPath, '.config');
    var localAWSInfoFilePath = path.join(dotConfigDirPath, 'local-aws-info.json');
    var localEnvInfoFilePath = path.join(dotConfigDirPath, 'local-env-info.json');
    var projectConfigFilePath = path.join(dotConfigDirPath, 'project-config.json');
    var currentCloudBackendDirPath = path.join(amplifyDirPath, '#current-cloud-backend');
    var currentAmplifyMetaFilePath = path.join(currentCloudBackendDirPath, 'amplify-meta.json');
    var backendDirPath = path.join(amplifyDirPath, 'backend');
    var amplifyMetaFilePath = path.join(backendDirPath, 'amplify-meta.json');
    return (fs.existsSync(amplifyDirPath) &&
        fs.existsSync(teamProviderInfoFilePath) &&
        fs.existsSync(dotConfigDirPath) &&
        fs.existsSync(localAWSInfoFilePath) &&
        fs.existsSync(localEnvInfoFilePath) &&
        fs.existsSync(projectConfigFilePath) &&
        fs.existsSync(currentCloudBackendDirPath) &&
        fs.existsSync(currentAmplifyMetaFilePath) &&
        fs.existsSync(backendDirPath) &&
        fs.existsSync(amplifyMetaFilePath));
};
exports.checkAmplifyFolderStructure = checkAmplifyFolderStructure;
var getTeamProviderInfo = function (projectRootDirPath) {
    var teamProviderInfo;
    var teamProviderInfoFilePath = path.join(projectRootDirPath, 'amplify', 'team-provider-info.json');
    if (fs.existsSync(teamProviderInfoFilePath)) {
        teamProviderInfo = util.readJsonFileSync(teamProviderInfoFilePath);
    }
    return teamProviderInfo;
};
exports.getTeamProviderInfo = getTeamProviderInfo;
var getProjectConfig = function (projectRootDirPath) {
    var projectConfig;
    var projectConfigPath = path.join(projectRootDirPath, 'amplify', '.config', 'project-config.json');
    if (fs.existsSync(projectConfigPath)) {
        projectConfig = util.readJsonFileSync(projectConfigPath);
    }
    return projectConfig;
};
exports.getProjectConfig = getProjectConfig;
//# sourceMappingURL=amplifyArtifactsManager.js.map