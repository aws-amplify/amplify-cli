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
exports.storeArtifactsForAmplifyService = exports.postPushCheck = exports.deleteEnv = exports.init = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const promise_sequential_1 = __importDefault(require("promise-sequential"));
const aws_s3_1 = require("./aws-utils/aws-s3");
const aws_amplify_1 = require("./aws-utils/aws-amplify");
const constants_1 = require("./constants");
const amplify_service_permission_check_1 = require("./amplify-service-permission-check");
const amplify_cli_core_1 = require("amplify-cli-core");
const aws_logger_1 = require("./utils/aws-logger");
const configuration_manager_1 = require("./configuration-manager");
const logger = (0, aws_logger_1.fileLogger)('amplify-service-manager');
async function init(amplifyServiceParams) {
    var _a, _b;
    const { context, awsConfigInfo, projectName, envName, stackName } = amplifyServiceParams;
    let amplifyAppId;
    let verifiedStackName = stackName;
    let deploymentBucketName = `${stackName}-deployment`;
    const amplifyClient = await (0, aws_amplify_1.getConfiguredAmplifyClient)(context, awsConfigInfo);
    if (!amplifyClient) {
        return {
            amplifyAppId,
            verifiedStackName,
            deploymentBucketName,
        };
    }
    const hasPermission = await (0, amplify_service_permission_check_1.checkAmplifyServiceIAMPermission)(context, amplifyClient);
    if (!hasPermission) {
        return {
            amplifyAppId,
            verifiedStackName,
            deploymentBucketName,
        };
    }
    if (context.exeInfo && context.exeInfo.inputParams && context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.appId) {
        const inputAmplifyAppId = context.exeInfo.inputParams.amplify.appId;
        logger('init.amplifyClient.getApp', [
            {
                appId: inputAmplifyAppId,
            },
        ])();
        try {
            const getAppResult = await amplifyClient
                .getApp({
                appId: inputAmplifyAppId,
            })
                .promise();
            context.print.info(`Amplify AppID found: ${inputAmplifyAppId}. Amplify App name is: ${getAppResult.app.name}`);
            amplifyAppId = inputAmplifyAppId;
        }
        catch (e) {
            throw new amplify_cli_core_1.AmplifyError('ProjectNotFoundError', {
                message: `Amplify AppID ${inputAmplifyAppId} not found.`,
                resolution: `Please ensure your local profile matches the AWS account or region in which the Amplify app exists.`,
            }, e);
        }
    }
    if (!amplifyAppId) {
        if (amplify_cli_core_1.stateManager.teamProviderInfoExists()) {
            const teamProviderInfo = amplify_cli_core_1.stateManager.getTeamProviderInfo();
            const envList = Object.keys(teamProviderInfo);
            let appIdsInTheSameLocalProjectAndRegion = [];
            for (const env of envList) {
                if (env !== envName &&
                    teamProviderInfo[env][constants_1.ProviderName].Region === awsConfigInfo.region &&
                    teamProviderInfo[env][constants_1.ProviderName][constants_1.AmplifyAppIdLabel] &&
                    !appIdsInTheSameLocalProjectAndRegion.includes(teamProviderInfo[env][constants_1.ProviderName][constants_1.AmplifyAppIdLabel])) {
                    appIdsInTheSameLocalProjectAndRegion.push(teamProviderInfo[env][constants_1.ProviderName][constants_1.AmplifyAppIdLabel]);
                }
            }
            if (appIdsInTheSameLocalProjectAndRegion.length > 0) {
                let apps = [];
                let listAppsResponse = {};
                do {
                    logger('init.amplifyClient.listApps', [
                        {
                            nextToken: listAppsResponse.nextToken,
                            maxResults: 25,
                        },
                    ])();
                    listAppsResponse = await amplifyClient
                        .listApps({
                        nextToken: listAppsResponse.nextToken,
                        maxResults: 25,
                    })
                        .promise();
                    apps = apps.concat(listAppsResponse.apps);
                } while (listAppsResponse.nextToken);
                const verifiedAppIds = apps.map((app) => app.appId);
                appIdsInTheSameLocalProjectAndRegion = appIdsInTheSameLocalProjectAndRegion.filter((appId) => verifiedAppIds.includes(appId));
                if (appIdsInTheSameLocalProjectAndRegion.length === 1) {
                    amplifyAppId = appIdsInTheSameLocalProjectAndRegion[0];
                }
                else if (appIdsInTheSameLocalProjectAndRegion.length > 1) {
                    context.print.info(`Your project is associated with multiple Amplify Service Apps in the region ${awsConfigInfo.region}`);
                    amplifyAppId = await SelectFromExistingAppId(context, appIdsInTheSameLocalProjectAndRegion);
                }
            }
        }
    }
    if (!amplifyAppId) {
        const createAppParams = {
            name: projectName,
            environmentVariables: { _LIVE_PACKAGE_UPDATES: '[{"pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]' },
        };
        logger('init.amplifyClient.createApp', [createAppParams])();
        try {
            if (amplifyAppCreationEnabled()) {
                const createAppResponse = await amplifyClient.createApp(createAppParams).promise();
                amplifyAppId = createAppResponse.app.appId;
            }
        }
        catch (e) {
            if (e.code === 'LimitExceededException') {
                throw new amplify_cli_core_1.AmplifyError('ProjectInitError', {
                    message: 'You have reached the Amplify App limit for this account and region',
                    resolution: 'Use a different account or region with fewer apps, or request a service limit increase: https://docs.aws.amazon.com/general/latest/gr/amplify.html#service-quotas-amplify',
                }, e);
            }
            if (((_b = (_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.awsConfigInfo) === null || _b === void 0 ? void 0 : _b.configLevel) === 'general' && e.code === 'ConfigError') {
                throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
                    code: e.code,
                    message: e.message,
                    resolution: 'https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html',
                });
            }
            throw new amplify_cli_core_1.AmplifyFault('ProjectInitFault', {
                message: e.message,
            }, e);
        }
    }
    if (!amplifyAppId) {
        return {
            amplifyAppId,
            verifiedStackName,
            deploymentBucketName,
        };
    }
    let needToCreateNewBackendEnv = false;
    const log = logger('init.amplifyClient.getBackendEnvironment', [
        {
            appId: amplifyAppId,
            environmentName: envName,
        },
    ]);
    try {
        log();
        const { backendEnvironment } = await amplifyClient
            .getBackendEnvironment({
            appId: amplifyAppId,
            environmentName: envName,
        })
            .promise();
        if (backendEnvironment) {
            verifiedStackName = backendEnvironment.stackName;
            deploymentBucketName = backendEnvironment.deploymentArtifacts;
        }
        else {
            needToCreateNewBackendEnv = true;
        }
    }
    catch (e) {
        log(e);
        needToCreateNewBackendEnv = true;
    }
    if (needToCreateNewBackendEnv) {
        context.print.info(`Adding backend environment ${envName} to AWS Amplify app: ${amplifyAppId}`);
        const createEnvParams = {
            appId: amplifyAppId,
            environmentName: envName,
            stackName,
            deploymentArtifacts: deploymentBucketName,
        };
        logger('init.amplifyClient.getBackendEnvironment', [createEnvParams])();
        await amplifyClient.createBackendEnvironment(createEnvParams).promise();
    }
    return {
        amplifyAppId,
        verifiedStackName,
        deploymentBucketName,
    };
}
exports.init = init;
async function deleteEnv(context, envName, awsConfigInfo) {
    if (amplify_cli_core_1.stateManager.teamProviderInfoExists()) {
        const teamProviderInfo = amplify_cli_core_1.stateManager.getTeamProviderInfo();
        if (teamProviderInfo[envName] &&
            teamProviderInfo[envName][constants_1.ProviderName] &&
            teamProviderInfo[envName][constants_1.ProviderName][constants_1.AmplifyAppIdLabel]) {
            const envConfig = await (0, configuration_manager_1.loadConfigurationForEnv)(context, envName);
            const amplifyClient = await (0, aws_amplify_1.getConfiguredAmplifyClient)(context, { ...awsConfigInfo, ...envConfig });
            if (!amplifyClient) {
                return;
            }
            const hasPermission = await (0, amplify_service_permission_check_1.checkAmplifyServiceIAMPermission)(context, amplifyClient);
            if (!hasPermission) {
                return;
            }
            const amplifyAppId = teamProviderInfo[envName][constants_1.ProviderName][constants_1.AmplifyAppIdLabel];
            const deleteEnvParams = {
                appId: amplifyAppId,
                environmentName: envName,
            };
            logger('deleteEnv.amplifyClient.deleteBackendEnvironment', [deleteEnvParams])();
            try {
                await amplifyClient.deleteBackendEnvironment(deleteEnvParams).promise();
            }
            catch (ex) {
                if (ex.code === 'NotFoundException') {
                    context.print.warning(ex.message);
                }
                else {
                    throw new amplify_cli_core_1.AmplifyFault('ProjectDeleteFault', {
                        message: ex.message,
                    }, ex);
                }
            }
        }
    }
}
exports.deleteEnv = deleteEnv;
async function postPushCheck(context) {
    const projectConfig = amplify_cli_core_1.stateManager.getProjectConfig();
    const { envName } = amplify_cli_core_1.stateManager.getLocalEnvInfo();
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const providerMeta = amplifyMeta.providers[constants_1.ProviderName];
    const appId = providerMeta[constants_1.AmplifyAppIdLabel];
    if (appId) {
        return;
    }
    const stackName = providerMeta.StackName;
    const region = providerMeta.Region;
    let amplifyAppId;
    const amplifyClient = await (0, aws_amplify_1.getConfiguredAmplifyClient)(context);
    if (!amplifyClient) {
        return;
    }
    const hasPermission = await (0, amplify_service_permission_check_1.checkAmplifyServiceIAMPermission)(context, amplifyClient);
    if (!hasPermission) {
        return;
    }
    const searchAmplifyServiceResult = await searchAmplifyService(amplifyClient, stackName);
    if (searchAmplifyServiceResult.backendEnvExists) {
        amplifyAppId = searchAmplifyServiceResult.amplifyAppId;
    }
    else {
        const teamProviderInfo = amplify_cli_core_1.stateManager.getTeamProviderInfo();
        const envList = Object.keys(teamProviderInfo);
        let appIdsInTheSameLocalProjectAndRegion = [];
        for (const env of envList) {
            if (env !== envName &&
                teamProviderInfo[env][constants_1.ProviderName].Region === region &&
                teamProviderInfo[env][constants_1.ProviderName][constants_1.AmplifyAppIdLabel]) {
                appIdsInTheSameLocalProjectAndRegion.push(teamProviderInfo[env][constants_1.ProviderName][constants_1.AmplifyAppIdLabel]);
            }
        }
        const verifiedAppIds = searchAmplifyServiceResult.apps.map((app) => app.appId);
        appIdsInTheSameLocalProjectAndRegion = appIdsInTheSameLocalProjectAndRegion.filter((appId) => verifiedAppIds.includes(appId));
        if (appIdsInTheSameLocalProjectAndRegion.length === 1) {
            amplifyAppId = appIdsInTheSameLocalProjectAndRegion[0];
        }
        else if (appIdsInTheSameLocalProjectAndRegion.length > 1) {
            context.print.info(`Your project is associated with multiple Amplify Service Apps in the region ${region}`);
            amplifyAppId = await SelectFromExistingAppId(context, appIdsInTheSameLocalProjectAndRegion);
        }
        if (!amplifyAppId) {
            const createAppParams = {
                name: projectConfig.projectName,
                environmentVariables: { _LIVE_PACKAGE_UPDATES: '[{"pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]' },
            };
            logger('postPushCheck.amplifyClient.createApp', [createAppParams])();
            try {
                if (amplifyAppCreationEnabled()) {
                    const createAppResponse = await amplifyClient.createApp(createAppParams).promise();
                    amplifyAppId = createAppResponse.app.appId;
                }
            }
            catch (e) {
                if (e.code === 'LimitExceededException') {
                }
                else if (e.code === 'BadRequestException' &&
                    e.message.includes('Rate exceeded while calling CreateApp, please slow down or try again later.')) {
                }
                else {
                    throw new amplify_cli_core_1.AmplifyFault('ProjectInitFault', {
                        message: e.message,
                    }, e);
                }
            }
        }
        if (!amplifyAppId) {
            return;
        }
        const createEnvParams = {
            appId: amplifyAppId,
            environmentName: envName,
            stackName: teamProviderInfo[envName][constants_1.ProviderName].StackName,
            deploymentArtifacts: teamProviderInfo[envName][constants_1.ProviderName].DeploymentBucketName,
        };
        logger('postPushCheck.amplifyClient.createBackendEnvironment', [createEnvParams])();
        await amplifyClient.createBackendEnvironment(createEnvParams).promise();
    }
    providerMeta[constants_1.AmplifyAppIdLabel] = amplifyAppId;
    amplify_cli_core_1.stateManager.setMeta(undefined, amplifyMeta);
    const tpi = amplify_cli_core_1.stateManager.getTeamProviderInfo();
    tpi[envName][constants_1.ProviderName][constants_1.AmplifyAppIdLabel] = amplifyAppId;
    amplify_cli_core_1.stateManager.setTeamProviderInfo(undefined, tpi);
}
exports.postPushCheck = postPushCheck;
async function SelectFromExistingAppId(context, appIdsInTheSameLocalProjectAndRegion) {
    let amplifyAppId;
    const LEARNMORE = 'Learn More';
    const NONE = 'None';
    const options = appIdsInTheSameLocalProjectAndRegion.slice(0);
    options.push(NONE);
    options.push(LEARNMORE);
    const answer = await inquirer_1.default.prompt({
        type: 'list',
        name: 'selection',
        message: `Select the app id you want this env to be associated with`,
        choices: options,
        default: options[0],
    });
    if (answer.selection === LEARNMORE) {
        displayAppIdSelectionLearnMore(context);
        amplifyAppId = await SelectFromExistingAppId(context, appIdsInTheSameLocalProjectAndRegion);
    }
    if (answer.selection !== NONE) {
        amplifyAppId = answer.selection;
    }
    return amplifyAppId;
}
function displayAppIdSelectionLearnMore(context) {
    context.print.info('');
    context.print.green('The AWS Amplify Console stores information on your backend environment in the cloud to facilitate collaboration workflows for your team.');
    context.print.green('Select an existing AWS Amplify Console app to associate this backend environment with the app.');
    context.print.green('Select None will lead to the creation of a new AWS Amplify Service App that this backend environment will be associated with.');
    context.print.info('');
}
async function searchAmplifyService(amplifyClient, stackName) {
    const result = {
        apps: [],
        backendEnvExists: false,
    };
    let listAppsResponse = {};
    do {
        logger('searchAmplifyService.amplifyClient.listApps', [
            {
                nextToken: listAppsResponse.nextToken,
                maxResults: 25,
            },
        ])();
        listAppsResponse = await amplifyClient
            .listApps({
            nextToken: listAppsResponse.nextToken,
            maxResults: 25,
        })
            .promise();
        result.apps = result.apps.concat(listAppsResponse.apps);
    } while (listAppsResponse.nextToken);
    if (listAppsResponse.apps.length > 0) {
        for (let i = 0; i < listAppsResponse.apps.length; i++) {
            let listEnvResponse = {};
            do {
                logger('searchAmplifyService.amplifyClient.listBackendEnvironments', [
                    {
                        appId: listAppsResponse.apps[i].appId,
                        nextToken: listEnvResponse.nextToken,
                    },
                ])();
                listEnvResponse = await amplifyClient
                    .listBackendEnvironments({
                    appId: listAppsResponse.apps[i].appId,
                    nextToken: listEnvResponse.nextToken,
                })
                    .promise();
                for (let j = 0; j < listEnvResponse.backendEnvironments.length; j++) {
                    if (listEnvResponse.backendEnvironments[j].stackName === stackName) {
                        result.backendEnvExists = true;
                        result.amplifyAppId = listAppsResponse.apps[i].appId;
                        result.environmentName = listEnvResponse.backendEnvironments[j].environmentName;
                    }
                }
            } while (listEnvResponse.nextToken && !result.backendEnvExists);
            if (result.backendEnvExists) {
                break;
            }
        }
    }
    return result;
}
function storeArtifactsForAmplifyService(context) {
    return aws_s3_1.S3.getInstance(context).then(async (s3) => {
        const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();
        const amplifyMetaFilePath = path.join(currentCloudBackendDir, 'amplify-meta.json');
        const backendConfigFilePath = path.join(currentCloudBackendDir, 'backend-config.json');
        const fileUploadTasks = [];
        fileUploadTasks.push(() => uploadFile(s3, amplifyMetaFilePath, 'amplify-meta.json'));
        fileUploadTasks.push(() => uploadFile(s3, backendConfigFilePath, 'backend-config.json'));
        await (0, promise_sequential_1.default)(fileUploadTasks);
    });
}
exports.storeArtifactsForAmplifyService = storeArtifactsForAmplifyService;
async function uploadFile(s3, filePath, key) {
    if (fs.existsSync(filePath)) {
        const s3Params = {
            Body: fs.createReadStream(filePath),
            Key: key,
        };
        logger('s3.uploadFile', [{ Key: key }])();
        await s3.uploadFile(s3Params);
    }
}
const amplifyAppCreationEnabled = () => !process.env || process.env.CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION !== '1';
//# sourceMappingURL=amplify-service-manager.js.map