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
exports.setCategoryParameters = exports.getCategoryParameters = exports.setCLIInputs = exports.getCLIInputs = exports.cliInputsExists = exports.setParameters = exports.getCloudFormationTemplate = exports.getParameters = exports.parametersExists = exports.isDeploymentSecretForEnvExists = exports.getDeploymentSecrets = exports.getAmplifyFlutterConfig = exports.getAmplifyIOSConfig = exports.getAwsIOSConfig = exports.getAwsAndroidConfig = exports.getS3StorageBucketName = exports.setTeamProviderInfo = exports.getTeamProviderInfo = exports.getRootStackTemplate = exports.getCloudBackendConfig = exports.getProjectConfig = exports.getLocalEnvInfo = exports.getBackendConfig = exports.getBackendAmplifyMeta = exports.getProjectTags = exports.getCustomPoliciesPath = exports.getProjectMeta = exports.getProjectMetaPath = exports.getAWSConfigIOSPath = exports.getAmplifyDirPath = exports.getAmplifyConfigFlutterPath = exports.getAmplifyConfigIOSPath = exports.getAmplifyConfigAndroidPath = exports.getAWSConfigAndroidPath = void 0;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const amplify_cli_core_1 = require("amplify-cli-core");
// eslint-disable-next-line spellcheck/spell-checker
const getAWSConfigAndroidPath = (projectRoot) => path.join(projectRoot, 'app', 'src', 'main', 'res', 'raw', 'awsconfiguration.json');
exports.getAWSConfigAndroidPath = getAWSConfigAndroidPath;
// eslint-disable-next-line spellcheck/spell-checker
const getAmplifyConfigAndroidPath = (projectRoot) => path.join(projectRoot, 'app', 'src', 'main', 'res', 'raw', 'amplifyconfiguration.json');
exports.getAmplifyConfigAndroidPath = getAmplifyConfigAndroidPath;
// eslint-disable-next-line spellcheck/spell-checker
const getAmplifyConfigIOSPath = (projectRoot) => path.join(projectRoot, 'amplifyconfiguration.json');
exports.getAmplifyConfigIOSPath = getAmplifyConfigIOSPath;
// eslint-disable-next-line spellcheck/spell-checker
const getAmplifyConfigFlutterPath = (projectRoot) => path.join(projectRoot, 'lib', 'amplifyconfiguration.dart');
exports.getAmplifyConfigFlutterPath = getAmplifyConfigFlutterPath;
const getAmplifyDirPath = (projectRoot) => path.join(projectRoot, 'amplify');
exports.getAmplifyDirPath = getAmplifyDirPath;
// eslint-disable-next-line spellcheck/spell-checker
const getAWSConfigIOSPath = (projectRoot) => path.join(projectRoot, 'awsconfiguration.json');
exports.getAWSConfigIOSPath = getAWSConfigIOSPath;
const getProjectMetaPath = (projectRoot) => path.join(projectRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
exports.getProjectMetaPath = getProjectMetaPath;
const getProjectMeta = (projectRoot) => {
    const metaFilePath = (0, exports.getProjectMetaPath)(projectRoot);
    return JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
};
exports.getProjectMeta = getProjectMeta;
const getCustomPoliciesPath = (projectRoot, category, resourceName) => path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'custom-policies.json');
exports.getCustomPoliciesPath = getCustomPoliciesPath;
const getProjectTags = (projectRoot) => {
    const projectTagsFilePath = path.join(projectRoot, 'amplify', '#current-cloud-backend', 'tags.json');
    return JSON.parse(fs.readFileSync(projectTagsFilePath, 'utf8'));
};
exports.getProjectTags = getProjectTags;
const getBackendAmplifyMeta = (projectRoot) => {
    const metaFilePath = path.join(projectRoot, 'amplify', 'backend', 'amplify-meta.json');
    return JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
};
exports.getBackendAmplifyMeta = getBackendAmplifyMeta;
const getBackendConfig = (projectRoot) => {
    const backendFConfigFilePath = path.join(projectRoot, 'amplify', 'backend', 'backend-config.json');
    return JSON.parse(fs.readFileSync(backendFConfigFilePath, 'utf8'));
};
exports.getBackendConfig = getBackendConfig;
const getLocalEnvInfo = (projectRoot) => {
    const localEnvInfoFilePath = path.join(projectRoot, 'amplify', '.config', 'local-env-info.json');
    return JSON.parse(fs.readFileSync(localEnvInfoFilePath, 'utf8'));
};
exports.getLocalEnvInfo = getLocalEnvInfo;
const getProjectConfig = (projectRoot) => {
    const projectConfigDir = path.join(projectRoot, 'amplify', '.config', 'project-config.json');
    return amplify_cli_core_1.JSONUtilities.readJson(projectConfigDir);
};
exports.getProjectConfig = getProjectConfig;
const getCloudBackendConfig = (projectRoot) => {
    const currentCloudPath = path.join(projectRoot, 'amplify', '#current-cloud-backend', 'backend-config.json');
    return JSON.parse(fs.readFileSync(currentCloudPath, 'utf8'));
};
exports.getCloudBackendConfig = getCloudBackendConfig;
const getRootStackTemplate = (projectRoot) => {
    const rootStackPath = path.join(projectRoot, 'amplify', 'backend', 'awscloudformation', 'build', 'root-cloudformation-stack.json');
    return JSON.parse(fs.readFileSync(rootStackPath, 'utf8'));
};
exports.getRootStackTemplate = getRootStackTemplate;
const getParameterPath = (projectRoot, category, resourceName) => path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'build', 'parameters.json');
const getCLIInputsPath = (projectRoot, category, resourceName) => path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'cli-inputs.json');
const getCategoryParameterPath = (projectRoot, category, resourceName) => path.join(projectRoot, 'amplify', 'backend', category, resourceName, `${category}-parameters.json`);
const getTeamProviderInfo = (projectRoot) => {
    const teamProviderFilePath = path.join(projectRoot, 'amplify', 'team-provider-info.json');
    return JSON.parse(fs.readFileSync(teamProviderFilePath, 'utf8'));
};
exports.getTeamProviderInfo = getTeamProviderInfo;
const setTeamProviderInfo = (projectRoot, content) => {
    const teamProviderFilePath = path.join(projectRoot, 'amplify', 'team-provider-info.json');
    amplify_cli_core_1.JSONUtilities.writeJson(teamProviderFilePath, content);
};
exports.setTeamProviderInfo = setTeamProviderInfo;
const getS3StorageBucketName = (projectRoot) => {
    const meta = (0, exports.getProjectMeta)(projectRoot);
    const { storage } = meta;
    const s3 = Object.keys(storage).filter((r) => storage[r].service === 'S3');
    const fStorageName = s3[0];
    return storage[fStorageName].output.BucketName;
};
exports.getS3StorageBucketName = getS3StorageBucketName;
const getAwsAndroidConfig = (projectRoot) => {
    const configPath = (0, exports.getAWSConfigAndroidPath)(projectRoot);
    return amplify_cli_core_1.JSONUtilities.readJson(configPath);
};
exports.getAwsAndroidConfig = getAwsAndroidConfig;
const getAwsIOSConfig = (projectRoot) => {
    const configPath = (0, exports.getAWSConfigIOSPath)(projectRoot);
    return amplify_cli_core_1.JSONUtilities.readJson(configPath);
};
exports.getAwsIOSConfig = getAwsIOSConfig;
const getAmplifyIOSConfig = (projectRoot) => {
    const configPath = (0, exports.getAmplifyConfigIOSPath)(projectRoot);
    return amplify_cli_core_1.JSONUtilities.readJson(configPath);
};
exports.getAmplifyIOSConfig = getAmplifyIOSConfig;
const getAmplifyFlutterConfig = (projectRoot) => {
    const configPath = (0, exports.getAmplifyConfigFlutterPath)(projectRoot);
    const dartFile = fs.readFileSync(configPath);
    return JSON.parse(dartFile.toString().split(/'''/)[1]);
};
exports.getAmplifyFlutterConfig = getAmplifyFlutterConfig;
const getDeploymentSecrets = () => {
    const deploymentSecretsPath = path.join(os.homedir(), '.aws', 'amplify', 'deployment-secrets.json');
    return (amplify_cli_core_1.JSONUtilities.readJson(deploymentSecretsPath, {
        throwIfNotExist: false,
    }) || { appSecrets: [] });
};
exports.getDeploymentSecrets = getDeploymentSecrets;
const isDeploymentSecretForEnvExists = (projectRoot, envName) => {
    const teamProviderInfo = (0, exports.getTeamProviderInfo)(projectRoot);
    const rootStackId = teamProviderInfo[envName].awscloudformation.StackId.split('/')[2];
    const resource = lodash_1.default.first(Object.keys(teamProviderInfo[envName].categories.auth));
    const deploymentSecrets = (0, exports.getDeploymentSecrets)();
    const deploymentSecretByAppId = lodash_1.default.find(deploymentSecrets.appSecrets, (appSecret) => appSecret.rootStackId === rootStackId);
    if (deploymentSecretByAppId) {
        const providerCredsPath = [envName, 'auth', resource, 'hostedUIProviderCreds'];
        return lodash_1.default.has(deploymentSecretByAppId.environments, providerCredsPath);
    }
    return false;
};
exports.isDeploymentSecretForEnvExists = isDeploymentSecretForEnvExists;
const parametersExists = (projectRoot, category, resourceName) => fs.existsSync(getParameterPath(projectRoot, category, resourceName));
exports.parametersExists = parametersExists;
const getParameters = (projectRoot, category, resourceName) => {
    const parametersPath = getParameterPath(projectRoot, category, resourceName);
    return amplify_cli_core_1.JSONUtilities.parse(fs.readFileSync(parametersPath, 'utf8'));
};
exports.getParameters = getParameters;
const getCloudFormationTemplate = (projectRoot, category, resourceName) => {
    let templatePath = path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'build', `${resourceName}-cloudformation-template.json`);
    if (!fs.existsSync(templatePath)) {
        templatePath = path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'build', 'cloudformation-template.json');
    }
    if (!fs.existsSync(templatePath)) {
        templatePath = path.join(projectRoot, 'amplify', 'backend', category, resourceName, `${resourceName}-cloudformation-template.json`);
    }
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Unable to locate cloudformation template for ${category} ${resourceName}`);
    }
    return amplify_cli_core_1.JSONUtilities.parse(fs.readFileSync(templatePath, 'utf8'));
};
exports.getCloudFormationTemplate = getCloudFormationTemplate;
const setParameters = (projectRoot, category, resourceName, parameters) => {
    const parametersPath = getParameterPath(projectRoot, category, resourceName);
    amplify_cli_core_1.JSONUtilities.writeJson(parametersPath, parameters);
};
exports.setParameters = setParameters;
const cliInputsExists = (projectRoot, category, resourceName) => fs.existsSync(getCLIInputsPath(projectRoot, category, resourceName));
exports.cliInputsExists = cliInputsExists;
const getCLIInputs = (projectRoot, category, resourceName) => {
    const parametersPath = getCLIInputsPath(projectRoot, category, resourceName);
    return amplify_cli_core_1.JSONUtilities.parse(fs.readFileSync(parametersPath, 'utf8'));
};
exports.getCLIInputs = getCLIInputs;
const setCLIInputs = (projectRoot, category, resourceName, parameters) => {
    const parametersPath = getCLIInputsPath(projectRoot, category, resourceName);
    amplify_cli_core_1.JSONUtilities.writeJson(parametersPath, parameters);
};
exports.setCLIInputs = setCLIInputs;
const getCategoryParameters = (projectRoot, category, resourceName) => {
    const filePath = getCategoryParameterPath(projectRoot, category, resourceName);
    return amplify_cli_core_1.JSONUtilities.parse(fs.readFileSync(filePath, 'utf8'));
};
exports.getCategoryParameters = getCategoryParameters;
const setCategoryParameters = (projectRoot, category, resourceName, params) => {
    const filePath = getCategoryParameterPath(projectRoot, category, resourceName);
    amplify_cli_core_1.JSONUtilities.writeJson(filePath, params);
};
exports.setCategoryParameters = setCategoryParameters;
//# sourceMappingURL=projectMeta.js.map