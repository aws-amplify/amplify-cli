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
exports.getConfiguredLocationServiceClient = exports.getConfiguredSSMClient = exports.getEnvParametersDownloadHandler = exports.getEnvParametersUploadHandler = exports.deleteEnvironmentParametersFromService = exports.rootStackFileName = exports.transformResourceWithOverrides = exports.storeRootStackTemplate = exports.cfnRootStackFileName = exports.getLocationRegionMapping = exports.getLocationSupportedRegion = exports.loadConfigurationForEnv = exports.storeCurrentCloudBackend = exports.resolveAppId = void 0;
const attachBackendWorker = require('./attach-backend');
const initializer = require('./initializer');
const initializeEnv = require('./initialize-env');
const resourcePusher = require('./push-resources');
const envRemover = require('./delete-env');
const providerUtils = require('./utility-functions');
const constants = require('./constants');
const configManager = require('./configuration-manager');
const setupNewUser = require('./setup-new-user');
const { displayHelpfulURLs } = require('./display-helpful-urls');
const aws = require('./aws-utils/aws');
const pinpoint = require('./aws-utils/aws-pinpoint');
const { getLexRegionMapping } = require('./aws-utils/aws-lex');
const amplifyService = require('./aws-utils/aws-amplify');
const consoleCommand = require('./console');
const { loadResourceParameters, saveResourceParameters } = require('./resourceParams');
const { formUserAgentParam } = require('./aws-utils/user-agent');
const predictionsRegionMap = require('./aws-predictions-regions');
const admin_login_1 = require("./admin-login");
const admin_helpers_1 = require("./utils/admin-helpers");
const CognitoUserPoolService_1 = require("./aws-utils/CognitoUserPoolService");
const IdentityPoolService_1 = require("./aws-utils/IdentityPoolService");
const S3Service_1 = require("./aws-utils/S3Service");
const DynamoDBService_1 = require("./aws-utils/DynamoDBService");
const resolve_appId_1 = require("./utils/resolve-appId");
const upload_current_cloud_backend_1 = require("./utils/upload-current-cloud-backend");
const configuration_manager_1 = require("./configuration-manager");
const aws_location_1 = require("./aws-utils/aws-location");
const aws_ssm_1 = require("./aws-utils/aws-ssm");
const aws_lambda_1 = require("./aws-utils/aws-lambda");
const aws_cfn_1 = __importDefault(require("./aws-utils/aws-cfn"));
const amplify_cli_core_1 = require("amplify-cli-core");
const resourceExport = __importStar(require("./export-resources"));
const exportUpdateMeta = __importStar(require("./export-update-amplify-meta"));
var resolve_appId_2 = require("./utils/resolve-appId");
Object.defineProperty(exports, "resolveAppId", { enumerable: true, get: function () { return resolve_appId_2.resolveAppId; } });
var upload_current_cloud_backend_2 = require("./utils/upload-current-cloud-backend");
Object.defineProperty(exports, "storeCurrentCloudBackend", { enumerable: true, get: function () { return upload_current_cloud_backend_2.storeCurrentCloudBackend; } });
var configuration_manager_2 = require("./configuration-manager");
Object.defineProperty(exports, "loadConfigurationForEnv", { enumerable: true, get: function () { return configuration_manager_2.loadConfigurationForEnv; } });
var aws_location_2 = require("./aws-utils/aws-location");
Object.defineProperty(exports, "getLocationSupportedRegion", { enumerable: true, get: function () { return aws_location_2.getLocationSupportedRegion; } });
Object.defineProperty(exports, "getLocationRegionMapping", { enumerable: true, get: function () { return aws_location_2.getLocationRegionMapping; } });
const update_env_1 = require("./update-env");
exports.cfnRootStackFileName = 'root-cloudformation-stack.json';
var initializer_1 = require("./initializer");
Object.defineProperty(exports, "storeRootStackTemplate", { enumerable: true, get: function () { return initializer_1.storeRootStackTemplate; } });
const override_manager_1 = require("./override-manager");
var override_manager_2 = require("./override-manager");
Object.defineProperty(exports, "transformResourceWithOverrides", { enumerable: true, get: function () { return override_manager_2.transformResourceWithOverrides; } });
const push_resources_1 = require("./push-resources");
var push_resources_2 = require("./push-resources");
Object.defineProperty(exports, "rootStackFileName", { enumerable: true, get: function () { return push_resources_2.rootStackFileName; } });
const utility_functions_1 = require("./utility-functions");
const aws_location_service_1 = require("./aws-utils/aws-location-service");
const upload_appsync_files_1 = require("./upload-appsync-files");
const pre_push_cfn_modifier_1 = require("./pre-push-cfn-processor/pre-push-cfn-modifier");
const api_key_helpers_1 = require("./utils/api-key-helpers");
const delete_ssm_parameters_1 = require("./utils/ssm-utils/delete-ssm-parameters");
var delete_ssm_parameters_2 = require("./utils/ssm-utils/delete-ssm-parameters");
Object.defineProperty(exports, "deleteEnvironmentParametersFromService", { enumerable: true, get: function () { return delete_ssm_parameters_2.deleteEnvironmentParametersFromService; } });
const env_parameter_ssm_helpers_1 = require("./utils/ssm-utils/env-parameter-ssm-helpers");
var env_parameter_ssm_helpers_2 = require("./utils/ssm-utils/env-parameter-ssm-helpers");
Object.defineProperty(exports, "getEnvParametersUploadHandler", { enumerable: true, get: function () { return env_parameter_ssm_helpers_2.getEnvParametersUploadHandler; } });
Object.defineProperty(exports, "getEnvParametersDownloadHandler", { enumerable: true, get: function () { return env_parameter_ssm_helpers_2.getEnvParametersDownloadHandler; } });
function init(context) {
    return initializer.run(context);
}
function initEnv(context, providerMetadata) {
    return initializeEnv.run(context, providerMetadata);
}
async function attachBackend(context) {
    await attachBackendWorker.run(context);
}
function onInitSuccessful(context) {
    return initializer.onInitSuccessful(context);
}
function exportResources(context, resourceList, exportType) {
    return resourceExport.run(context, resourceList, exportType);
}
function exportedStackResourcesUpdateMeta(context, stackName) {
    return exportUpdateMeta.run(context, stackName);
}
function pushResources(context, resourceList, rebuild) {
    return resourcePusher.run(context, resourceList, rebuild);
}
function deleteEnv(context, envName, deleteS3) {
    return envRemover.run(context, envName, deleteS3);
}
function configure(context) {
    return configManager.configure(context);
}
async function getConfiguredAWSClient(context, category, action) {
    await aws.configureWithCreds(context);
    category = category || 'missing';
    action = action || ['missing'];
    const userAgentAction = `${category}:${action[0]}`;
    aws.config.update({
        customUserAgent: formUserAgentParam(context, userAgentAction),
    });
    return aws;
}
function getConfiguredPinpointClient(context, category, action, envName) {
    return pinpoint.getConfiguredPinpointClient(context, category, action, envName);
}
function getPinpointRegionMapping() {
    return pinpoint.getPinpointRegionMapping();
}
function getConfiguredAmplifyClient(context, category, action, options = {}) {
    return amplifyService.getConfiguredAmplifyClient(context, options);
}
function showHelpfulLinks(context, resources) {
    return displayHelpfulURLs(context, resources);
}
function configureNewUser(context) {
    return setupNewUser.run(context);
}
async function openConsole(context) {
    return consoleCommand.run(context);
}
async function getConfiguredSSMClient(context) {
    return await aws_ssm_1.SSM.getInstance(context);
}
exports.getConfiguredSSMClient = getConfiguredSSMClient;
async function getConfiguredLocationServiceClient(context, options) {
    return await aws_location_service_1.LocationService.getInstance(context, options);
}
exports.getConfiguredLocationServiceClient = getConfiguredLocationServiceClient;
async function getLambdaSdk(context) {
    return await new aws_lambda_1.Lambda(context);
}
async function getCloudFormationSdk(context) {
    return await new aws_cfn_1.default(context);
}
module.exports = {
    adminBackendMap: admin_helpers_1.adminBackendMap,
    adminLoginFlow: admin_login_1.adminLoginFlow,
    console: openConsole,
    attachBackend,
    exportResources,
    exportedStackResourcesUpdateMeta,
    init,
    initEnv,
    isAmplifyAdminApp: admin_helpers_1.isAmplifyAdminApp,
    getCloudFormationSdk,
    getLambdaSdk,
    onInitSuccessful,
    configure,
    configureNewUser,
    constants,
    pushResources,
    storeCurrentCloudBackend: upload_current_cloud_backend_1.storeCurrentCloudBackend,
    providerUtils,
    setupNewUser,
    getConfiguredAWSClient,
    getPinpointRegionMapping,
    getLexRegionMapping,
    getConfiguredPinpointClient,
    getConfiguredAmplifyClient,
    showHelpfulLinks,
    deleteEnv,
    loadResourceParameters,
    saveResourceParameters,
    predictionsRegionMap,
    ...require('./amplify-plugin-index'),
    CognitoUserPoolService: CognitoUserPoolService_1.CognitoUserPoolService,
    createCognitoUserPoolService: CognitoUserPoolService_1.createCognitoUserPoolService,
    IdentityPoolService: IdentityPoolService_1.IdentityPoolService,
    createIdentityPoolService: IdentityPoolService_1.createIdentityPoolService,
    S3Service: S3Service_1.S3Service,
    createS3Service: S3Service_1.createS3Service,
    DynamoDBService: DynamoDBService_1.DynamoDBService,
    createDynamoDBService: DynamoDBService_1.createDynamoDBService,
    resolveAppId: resolve_appId_1.resolveAppId,
    loadConfigurationForEnv: configuration_manager_1.loadConfigurationForEnv,
    getConfiguredSSMClient,
    updateEnv: update_env_1.updateEnv,
    getLocationSupportedRegion: aws_location_1.getLocationSupportedRegion,
    getLocationRegionMapping: aws_location_1.getLocationRegionMapping,
    getTransformerVersion: amplify_cli_core_1.ApiCategoryFacade.getTransformerVersion,
    transformResourceWithOverrides: override_manager_1.transformResourceWithOverrides,
    rootStackFileName: push_resources_1.rootStackFileName,
    compileSchema: utility_functions_1.compileSchema,
    getConfiguredLocationServiceClient,
    hashDirectory: upload_appsync_files_1.hashDirectory,
    prePushCfnTemplateModifier: pre_push_cfn_modifier_1.prePushCfnTemplateModifier,
    getApiKeyConfig: api_key_helpers_1.getApiKeyConfig,
    getEnvParametersDownloadHandler: env_parameter_ssm_helpers_1.getEnvParametersDownloadHandler,
    getEnvParametersUploadHandler: env_parameter_ssm_helpers_1.getEnvParametersUploadHandler,
    deleteEnvironmentParametersFromService: delete_ssm_parameters_1.deleteEnvironmentParametersFromService,
};
//# sourceMappingURL=index.js.map