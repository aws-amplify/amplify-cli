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
exports.run = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const amplify_cli_core_1 = require("amplify-cli-core");
const configurationManager = __importStar(require("./configuration-manager"));
const aws_amplify_1 = require("./aws-utils/aws-amplify");
const amplify_service_permission_check_1 = require("./amplify-service-permission-check");
const constants_1 = __importDefault(require("./constants"));
const aws_logger_1 = require("./utils/aws-logger");
const upload_current_cloud_backend_1 = require("./utils/upload-current-cloud-backend");
const logger = (0, aws_logger_1.fileLogger)('amplify-service-migrate');
const run = async (context) => {
    let projectDetails;
    let currentAmplifyMetaFilePath;
    let currentAmplifyMeta;
    let awsConfigInfo;
    let isProjectFullySetUp = false;
    try {
        projectDetails = context.amplify.getProjectDetails();
        currentAmplifyMetaFilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath();
        currentAmplifyMeta = context.amplify.readJsonFile(currentAmplifyMetaFilePath);
        awsConfigInfo = await configurationManager.getAwsConfig(context);
        isProjectFullySetUp = true;
    }
    catch (e) {
        isProjectFullySetUp = false;
    }
    if (!isProjectFullySetUp) {
        return;
    }
    const { amplifyMeta, localEnvInfo } = projectDetails;
    const { envName } = localEnvInfo;
    const teamProviderInfo = amplify_cli_core_1.stateManager.getTeamProviderInfo();
    if (teamProviderInfo[envName][constants_1.default.ProviderName][constants_1.default.AmplifyAppIdLabel]) {
        return;
    }
    const amplifyClient = await (0, aws_amplify_1.getConfiguredAmplifyClient)(context, awsConfigInfo);
    if (!amplifyClient) {
        const message = `Amplify service is not available in the region ${awsConfigInfo.region ? awsConfigInfo.region : ''}`;
        throw new amplify_cli_core_1.AmplifyError('RegionNotAvailableError', { message });
    }
    const hasPermission = await (0, amplify_service_permission_check_1.checkAmplifyServiceIAMPermission)(context, amplifyClient);
    if (!hasPermission) {
        const message = 'Permissions to access Amplify service is required.';
        throw new amplify_cli_core_1.AmplifyError('PermissionsError', { message });
    }
    const { inputParams } = context.exeInfo;
    if (inputParams.amplify && inputParams.amplify.appId) {
        const amplifyAppId = inputParams.amplify.appId;
        logger('run.amplifyClient.getApp', [
            {
                appId: amplifyAppId,
            },
        ])();
        try {
            const getAppResult = await amplifyClient
                .getApp({
                appId: amplifyAppId,
            })
                .promise();
            context.print.info(`Amplify AppID found: ${amplifyAppId}. Amplify App name is: ${getAppResult.app.name}`);
        }
        catch (e) {
            throw new amplify_cli_core_1.AmplifyError('ProjectNotFoundError', {
                message: `Amplify AppID: ${amplifyAppId} not found.`,
                resolution: `Please ensure your local profile matches the AWS account or region in which the Amplify app exists.`,
            }, e);
        }
        let backendEnvs = [];
        let listEnvResponse = {};
        do {
            logger('run.amplifyClient.listBackendEnvironments', [
                {
                    appId: amplifyAppId,
                    nextToken: listEnvResponse.nextToken,
                },
            ])();
            listEnvResponse = await amplifyClient
                .listBackendEnvironments({
                appId: amplifyAppId,
                nextToken: listEnvResponse.nextToken,
            })
                .promise();
            backendEnvs = backendEnvs.concat(listEnvResponse.backendEnvironments);
        } while (listEnvResponse.nextToken);
        const { StackName, DeploymentBucketName } = projectDetails.amplifyMeta.providers[constants_1.default.ProviderName];
        if (!backendEnvs.includes(envName)) {
            context.print.info(`Adding backend environment ${envName} to AWS Amplify app: ${amplifyAppId}`);
            const createEnvParams = {
                appId: amplifyAppId,
                environmentName: envName,
                stackName: StackName,
                deploymentArtifacts: DeploymentBucketName,
            };
            const log = logger('run.amplifyClient.createBackendEnvironment', [createEnvParams]);
            log();
            try {
                await amplifyClient.createBackendEnvironment(createEnvParams).promise();
            }
            catch (ex) {
                log(ex);
            }
        }
        else {
            const getEnvParams = {
                appId: amplifyAppId,
                environmentName: envName,
            };
            logger('run.amplifyClient.getBackendEnvironment', [getEnvParams])();
            const { backendEnvironment } = await amplifyClient.getBackendEnvironment(getEnvParams).promise();
            if (StackName !== backendEnvironment.stackName) {
                throw new amplify_cli_core_1.AmplifyError('InvalidStackError', {
                    message: `Stack name mismatch for the backend environment ${envName}. Local: ${StackName}, Amplify: ${backendEnvironment.stackName}`,
                });
            }
        }
        teamProviderInfo[envName][constants_1.default.ProviderName][constants_1.default.AmplifyAppIdLabel] = amplifyAppId;
        amplifyMeta.providers[constants_1.default.ProviderName][constants_1.default.AmplifyAppIdLabel] = amplifyAppId;
        const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
        let jsonString = JSON.stringify(amplifyMeta, null, 4);
        fs_extra_1.default.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
        currentAmplifyMeta.providers[constants_1.default.ProviderName][constants_1.default.AmplifyAppIdLabel] = amplifyAppId;
        jsonString = JSON.stringify(currentAmplifyMeta, null, 4);
        fs_extra_1.default.writeFileSync(currentAmplifyMetaFilePath, jsonString, 'utf8');
        const teamProviderInfoFilePath = context.amplify.pathManager.getProviderInfoFilePath();
        jsonString = JSON.stringify(teamProviderInfo, null, 4);
        fs_extra_1.default.writeFileSync(teamProviderInfoFilePath, jsonString, 'utf8');
        await (0, upload_current_cloud_backend_1.storeCurrentCloudBackend)(context);
    }
};
exports.run = run;
//# sourceMappingURL=amplify-service-migrate.js.map