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
exports.pathManager = exports.PathManager = exports.PathConstants = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const os_1 = require("os");
const __1 = require("..");
exports.PathConstants = {
    DotAWSDirName: '.aws',
    AWSCredentials: 'credentials',
    AWSConfig: 'config',
    DeploymentSecretsFileName: 'deployment-secrets.json',
    AmplifyAdminDirName: 'admin',
    AmplifyDirName: 'amplify',
    DotAmplifyDirName: '.amplify',
    DotConfigDirName: '.config',
    BackendDirName: 'backend',
    CurrentCloudBackendDirName: '#current-cloud-backend',
    HooksDirName: 'hooks',
    BuildDirName: 'build',
    OverrideDirName: 'overrides',
    ProviderName: 'awscloudformation',
    CfnStacksBuildDirName: 'build',
    AmplifyAdminConfigFileName: 'config.json',
    AmplifyRcFileName: '.amplifyrc',
    GitIgnoreFileName: '.gitignore',
    ProjectConfigFileName: 'project-config.json',
    AmplifyMetaFileName: 'amplify-meta.json',
    TagsFileName: 'tags.json',
    ParametersJsonFileName: 'parameters.json',
    ReadMeFileName: 'README.md',
    HooksConfigFileName: 'hooks-config.json',
    HooksShellSampleFileName: 'post-push.sh.sample',
    HooksJsSampleFileName: 'pre-push.js.sample',
    HooksReadmeFileName: 'hooks-readme.md',
    LocalEnvFileName: 'local-env-info.json',
    LocalAWSInfoFileName: 'local-aws-info.json',
    TeamProviderInfoFileName: 'team-provider-info.json',
    BackendConfigFileName: 'backend-config.json',
    CLIJSONFileName: 'cli.json',
    CLIJSONFileNameGlob: 'cli*.json',
    CLIJsonWithEnvironmentFileName: (env) => `cli.${env}.json`,
    CLIInputsJsonFileName: 'cli-inputs.json',
    CfnFileName: (resourceName) => `${resourceName}-awscloudformation-template.json`,
    CustomPoliciesFilename: 'custom-policies.json',
    DefaultFrontEndExportFolder: './exported-amplify-front-end-config',
    DefaultExportFolder: './export-amplify-stack',
    ExportManifestJsonFilename: 'amplify-export-manifest.json',
    ExportTagsJsonFileName: 'export-tags.json',
    ExportCategoryStackMappingJsonFilename: 'category-stack-mapping.json',
    OverrideFileName: 'override.ts',
};
class PathManager {
    constructor() {
        this.getAmplifyPackageLibDirPath = (packageName) => {
            const descopedPackageName = packageName.replace(/^@/, '').replace(/\//, '-');
            const result = path.join(this.getAmplifyLibRoot(), descopedPackageName);
            if (!process.env.AMPLIFY_SUPPRESS_NO_PKG_LIB && !fs.pathExistsSync(result)) {
                throw new Error(`Package lib at ${result} does not exist.`);
            }
            return result;
        };
        this.getAmplifyLibRoot = () => path.join(this.getHomeDotAmplifyDirPath(), 'lib');
        this.getHomeDotAmplifyDirPath = () => this.homeDotAmplifyDirPath;
        this.getAmplifyAdminDirPath = () => this.constructPath(this.getHomeDotAmplifyDirPath(), [exports.PathConstants.AmplifyAdminDirName]);
        this.getAmplifyAdminConfigFilePath = () => this.constructPath(this.getAmplifyAdminDirPath(), [exports.PathConstants.AmplifyAdminConfigFileName]);
        this.getAmplifyDirPath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName]);
        this.getDotConfigDirPath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.DotConfigDirName]);
        this.getBackendDirPath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.BackendDirName]);
        this.getCurrentCloudBackendDirPath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.CurrentCloudBackendDirName]);
        this.getCurrentResourceParametersJsonPath = (projectPath, categoryName, resourceName) => path.join(this.getCurrentCloudBackendDirPath(projectPath), categoryName, resourceName, exports.PathConstants.ParametersJsonFileName);
        this.getCurrentCfnTemplatePath = (projectPath, categoryName, resourceName) => path.join(this.getCurrentCloudBackendDirPath(projectPath), categoryName, resourceName, exports.PathConstants.CfnFileName(resourceName));
        this.getAmplifyRcFilePath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyRcFileName]);
        this.getGitIgnoreFilePath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.GitIgnoreFileName]);
        this.getTeamProviderInfoFilePath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.TeamProviderInfoFileName]);
        this.getProjectConfigFilePath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.DotConfigDirName, exports.PathConstants.ProjectConfigFileName]);
        this.getLocalEnvFilePath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.DotConfigDirName, exports.PathConstants.LocalEnvFileName]);
        this.getLocalAWSInfoFilePath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.DotConfigDirName, exports.PathConstants.LocalAWSInfoFileName]);
        this.getAmplifyMetaFilePath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.BackendDirName, exports.PathConstants.AmplifyMetaFileName]);
        this.getBackendConfigFilePath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.BackendDirName, exports.PathConstants.BackendConfigFileName]);
        this.getTagFilePath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.BackendDirName, exports.PathConstants.TagsFileName]);
        this.getCurrentTagFilePath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.CurrentCloudBackendDirName, exports.PathConstants.TagsFileName]);
        this.getResourceDirectoryPath = (projectPath, category, resourceName) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.BackendDirName, category, resourceName]);
        this.getResourceInputsJsonFilePath = (projectPath, category, resourceName) => path.join(this.getResourceDirectoryPath(projectPath, category, resourceName), exports.PathConstants.CLIInputsJsonFileName);
        this.getResourceParametersFilePath = (projectPath, category, resourceName) => {
            let isBuildParametersJson = false;
            const resourceDirPath = this.getResourceDirectoryPath(projectPath, category, resourceName);
            if (!fs.existsSync(path.join(resourceDirPath, exports.PathConstants.ParametersJsonFileName)) &&
                fs.existsSync(path.join(resourceDirPath, exports.PathConstants.CLIInputsJsonFileName)) &&
                __1.overriddenCategories.includes(category)) {
                isBuildParametersJson = true;
            }
            const basePath = isBuildParametersJson ? path.join(resourceDirPath, exports.PathConstants.BuildDirName) : resourceDirPath;
            return path.join(basePath, exports.PathConstants.ParametersJsonFileName);
        };
        this.getResourceCfnTemplatePath = (projectPath, category, resourceName, buildDirectory = false) => {
            const resourceDirPath = this.getResourceDirectoryPath(projectPath, category, resourceName);
            const basePath = buildDirectory ? path.join(resourceDirPath, exports.PathConstants.BuildDirName) : resourceDirPath;
            return path.join(basePath, exports.PathConstants.CfnFileName(resourceName));
        };
        this.getReadMeFilePath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.ReadMeFileName]);
        this.getCurrentAmplifyMetaFilePath = (projectPath) => this.constructPath(projectPath, [
            exports.PathConstants.AmplifyDirName,
            exports.PathConstants.CurrentCloudBackendDirName,
            exports.PathConstants.AmplifyMetaFileName,
        ]);
        this.getCurrentBackendConfigFilePath = (projectPath) => this.constructPath(projectPath, [
            exports.PathConstants.AmplifyDirName,
            exports.PathConstants.CurrentCloudBackendDirName,
            exports.PathConstants.BackendConfigFileName,
        ]);
        this.getDotAWSDirPath = () => path.normalize(path.join((0, os_1.homedir)(), exports.PathConstants.DotAWSDirName));
        this.getCustomPoliciesPath = (category, resourceName) => path.join(this.getResourceDirectoryPath(undefined, category, resourceName), exports.PathConstants.CustomPoliciesFilename);
        this.getAWSCredentialsFilePath = () => process.env.AWS_SHARED_CREDENTIALS_FILE || path.normalize(path.join(this.getDotAWSDirPath(), exports.PathConstants.AWSCredentials));
        this.getAWSConfigFilePath = () => process.env.AWS_CONFIG_FILE || path.normalize(path.join(this.getDotAWSDirPath(), exports.PathConstants.AWSConfig));
        this.getCLIJSONFilePath = (projectPath, env) => {
            const fileName = env === undefined ? exports.PathConstants.CLIJSONFileName : exports.PathConstants.CLIJsonWithEnvironmentFileName(env);
            return this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, fileName]);
        };
        this.getDotAWSAmplifyDirPath = () => path.normalize(path.join((0, os_1.homedir)(), exports.PathConstants.DotAWSDirName, exports.PathConstants.AmplifyDirName));
        this.getDeploymentSecrets = () => path.normalize(path.join(this.getDotAWSAmplifyDirPath(), exports.PathConstants.DeploymentSecretsFileName));
        this.getHooksDirPath = (projectPath) => this.constructPath(projectPath, [exports.PathConstants.AmplifyDirName, exports.PathConstants.HooksDirName]);
        this.getHooksConfigFilePath = (projectPath) => path.join(this.getHooksDirPath(projectPath), exports.PathConstants.HooksConfigFileName);
        this.getOverrideDirPath = (projectPath, category, resourceName) => this.constructPath(projectPath, [
            exports.PathConstants.AmplifyDirName,
            exports.PathConstants.BackendDirName,
            category,
            resourceName,
            exports.PathConstants.OverrideDirName,
        ]);
        this.getRootOverrideDirPath = (projectPath) => this.constructPath(projectPath, [
            exports.PathConstants.AmplifyDirName,
            exports.PathConstants.BackendDirName,
            exports.PathConstants.ProviderName,
            exports.PathConstants.OverrideDirName,
        ]);
        this.getRootStackBuildDirPath = (projectPath) => this.constructPath(projectPath, [
            exports.PathConstants.AmplifyDirName,
            exports.PathConstants.BackendDirName,
            exports.PathConstants.ProviderName,
            exports.PathConstants.BuildDirName,
        ]);
        this.getCurrentCloudRootStackDirPath = (projectPath) => this.constructPath(projectPath, [
            exports.PathConstants.AmplifyDirName,
            exports.PathConstants.CurrentCloudBackendDirName,
            exports.PathConstants.ProviderName,
            exports.PathConstants.BuildDirName,
        ]);
        this.getResourceOverrideFilePath = (projectPath, category, resourceName) => this.constructPath(projectPath, [
            exports.PathConstants.AmplifyDirName,
            exports.PathConstants.BackendDirName,
            category,
            resourceName,
            exports.PathConstants.OverrideFileName,
        ]);
        this.constructPath = (projectPath, segments = []) => {
            if (!projectPath) {
                projectPath = this.findProjectRoot();
            }
            if (projectPath) {
                return path.normalize(path.join(projectPath, ...segments));
            }
            throw (0, __1.projectNotInitializedError)();
        };
        this.validateProjectPath = (projectPath) => {
            if (fs.existsSync(projectPath)) {
                const amplifyDirPath = this.getAmplifyDirPath(projectPath);
                const dotConfigDirPath = this.getDotConfigDirPath(projectPath);
                const localEnvFilePath = this.getLocalEnvFilePath(projectPath);
                const currentCloudBackendDirPath = exports.pathManager.getCurrentCloudBackendDirPath(projectPath);
                const backendDirPath = exports.pathManager.getBackendDirPath(projectPath);
                const projectConfigPath = exports.pathManager.getProjectConfigFilePath(projectPath);
                if (fs.existsSync(amplifyDirPath) && fs.existsSync(dotConfigDirPath)) {
                    if (fs.existsSync(currentCloudBackendDirPath) && fs.existsSync(backendDirPath)) {
                        return true;
                    }
                    if (fs.existsSync(projectConfigPath)) {
                        return true;
                    }
                    if (fs.existsSync(localEnvFilePath)) {
                        return projectPath === __1.stateManager.getLocalEnvInfo(projectPath).projectPath;
                    }
                }
            }
            return false;
        };
        this.findProjectRoot = () => {
            let currentPath = process.cwd();
            while (true) {
                if (this.validateProjectPath(currentPath)) {
                    return currentPath;
                }
                const parentPath = path.dirname(currentPath);
                if (currentPath === parentPath) {
                    break;
                }
                currentPath = parentPath;
            }
            return undefined;
        };
        this.homeDotAmplifyDirPath = path.join((0, os_1.homedir)(), exports.PathConstants.DotAmplifyDirName);
    }
}
exports.PathManager = PathManager;
exports.pathManager = new PathManager();
//# sourceMappingURL=pathManager.js.map