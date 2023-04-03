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
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const glob_1 = __importDefault(require("glob"));
const extract_zip_1 = __importDefault(require("extract-zip"));
const inquirer_1 = __importDefault(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const amplify_cli_core_1 = require("amplify-cli-core");
const configurationManager = __importStar(require("./configuration-manager"));
const aws_amplify_1 = require("./aws-utils/aws-amplify");
const amplify_service_permission_check_1 = require("./amplify-service-permission-check");
const constants_1 = __importDefault(require("./constants"));
const admin_helpers_1 = require("./utils/admin-helpers");
const resolve_appId_1 = require("./utils/resolve-appId");
const admin_login_1 = require("./admin-login");
const aws_logger_1 = require("./utils/aws-logger");
const logger = (0, aws_logger_1.fileLogger)('attach-backend');
const run = async (context) => {
    let appId;
    let awsConfigInfo;
    let isAdminApp = false;
    try {
        appId = (0, resolve_appId_1.resolveAppId)(context);
    }
    catch (e) {
    }
    const { envName } = lodash_1.default.get(context, ['exeInfo', 'inputParams', 'amplify'], {});
    const { useProfile, configLevel } = lodash_1.default.get(context, ['exeInfo', 'inputParams', 'awscloudformation'], {});
    if (!useProfile && (!configLevel || configLevel === 'amplifyAdmin') && appId) {
        const res = await (0, admin_helpers_1.isAmplifyAdminApp)(appId);
        isAdminApp = res.isAdminApp;
        if (isAdminApp) {
            if (!envName) {
                throw new amplify_cli_core_1.AmplifyError('EnvironmentNameError', {
                    message: 'Missing --envName <environment name> in parameters.',
                });
            }
            try {
                await (0, admin_login_1.adminLoginFlow)(context, appId, envName, res.region);
            }
            catch (e) {
                throw new amplify_cli_core_1.AmplifyError('AmplifyStudioLoginError', {
                    message: `Failed to authenticate: ${e.message || 'Unknown error occurred.'}`,
                }, e);
            }
        }
    }
    if (isAdminApp) {
        context.exeInfo.awsConfigInfo = {
            configLevel: 'amplifyAdmin',
            config: {},
        };
        awsConfigInfo = await configurationManager.loadConfigurationForEnv(context, envName, appId);
    }
    else {
        await configurationManager.init(context);
        awsConfigInfo = await configurationManager.getAwsConfig(context);
    }
    const amplifyClient = await (0, aws_amplify_1.getConfiguredAmplifyClient)(context, awsConfigInfo);
    if (!amplifyClient) {
        const region = awsConfigInfo && awsConfigInfo.region ? awsConfigInfo.region : '<unknown>';
        throw new amplify_cli_core_1.AmplifyError('RegionNotAvailableError', {
            message: `Amplify service is not available in the region ${region}`,
        });
    }
    const hasPermission = await (0, amplify_service_permission_check_1.checkAmplifyServiceIAMPermission)(context, amplifyClient);
    if (!hasPermission) {
        throw new amplify_cli_core_1.AmplifyError('PermissionsError', {
            message: 'Permissions to access Amplify service is required.',
        });
    }
    const amplifyApp = await getAmplifyApp(context, amplifyClient);
    const backendEnv = await getBackendEnv(context, amplifyClient, amplifyApp);
    await downloadBackend(context, backendEnv, awsConfigInfo);
    const currentAmplifyMeta = await ensureAmplifyMeta(context, amplifyApp, awsConfigInfo);
    context.exeInfo.projectConfig.projectName = amplifyApp.name;
    context.exeInfo.localEnvInfo.envName = backendEnv.environmentName;
    lodash_1.default.setWith(context, ['exeInfo', 'teamProviderInfo', backendEnv.environmentName], currentAmplifyMeta.providers);
};
exports.run = run;
async function ensureAmplifyMeta(context, amplifyApp, awsConfigInfo) {
    const projectPath = process.cwd();
    const currentAmplifyMetaFilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath(projectPath);
    const currentAmplifyMeta = context.amplify.readJsonFile(currentAmplifyMetaFilePath);
    if (!currentAmplifyMeta.providers[constants_1.default.ProviderName][constants_1.default.AmplifyAppIdLabel]) {
        currentAmplifyMeta.providers[constants_1.default.ProviderName][constants_1.default.AmplifyAppIdLabel] = amplifyApp.appId;
        const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath(projectPath);
        const jsonString = JSON.stringify(currentAmplifyMeta, null, 4);
        fs_extra_1.default.writeFileSync(currentAmplifyMetaFilePath, jsonString, 'utf8');
        fs_extra_1.default.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
        const { DeploymentBucketName } = currentAmplifyMeta.providers[constants_1.default.ProviderName];
        await storeArtifactsForAmplifyService(context, awsConfigInfo, DeploymentBucketName);
    }
    return currentAmplifyMeta;
}
async function storeArtifactsForAmplifyService(context, awsConfigInfo, deploymentBucketName) {
    const projectPath = process.cwd();
    const s3Client = new aws_sdk_1.default.S3(awsConfigInfo);
    const amplifyMetaFilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath(projectPath);
    const backendConfigFilePath = context.amplify.pathManager.getCurrentBackendConfigFilePath(projectPath);
    await uploadFile(s3Client, deploymentBucketName, amplifyMetaFilePath);
    await uploadFile(s3Client, deploymentBucketName, backendConfigFilePath);
}
async function uploadFile(s3Client, bucketName, filePath) {
    if (!fs_extra_1.default.existsSync(filePath)) {
        return;
    }
    const key = path_1.default.basename(filePath);
    const body = fs_extra_1.default.createReadStream(filePath);
    const s3Params = {
        Bucket: bucketName,
        Key: key,
        Body: body,
    };
    logger('uploadFile.s3.uploadFile', [{ Key: key, Bucket: bucketName }])();
    await s3Client.putObject(s3Params).promise();
}
async function getAmplifyApp(context, amplifyClient) {
    const { inputParams } = context.exeInfo;
    if (inputParams.amplify && inputParams.amplify.appId) {
        const inputAmplifyAppId = inputParams.amplify.appId;
        logger('getAmplifyApp.amplifyClient.getApp', [
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
            return getAppResult.app;
        }
        catch (e) {
            throw new amplify_cli_core_1.AmplifyError('ProjectNotFoundError', {
                message: e.message && e.name && e.name === 'NotFoundException' ? e.message : `Amplify AppID: ${inputAmplifyAppId} not found.`,
                resolution: e.name && e.name === 'NotFoundException'
                    ? 'Check that the region of the Amplify App is matching the configured region.'
                    : 'Ensure your local profile matches the AWS account or region in which the Amplify app exists.',
            }, e);
        }
    }
    let apps = [];
    let listAppsResponse = {};
    do {
        logger('getAmplifyApp.amplifyClient.listApps', [
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
    if (apps.length >= 1) {
        const options = [];
        apps.forEach((app) => {
            const option = {
                name: `${app.name} (${app.appId})`,
                value: app,
                short: app.appId,
            };
            options.push(option);
        });
        const { selection } = await inquirer_1.default.prompt({
            type: 'list',
            name: 'selection',
            message: 'Which app are you working on?',
            choices: options,
        });
        return selection;
    }
    throw new amplify_cli_core_1.AmplifyError('ProjectNotFoundError', {
        message: 'No Amplify apps found.',
        resolution: 'Ensure your local profile matches the AWS account or region in which the Amplify app exists.',
    });
}
async function getBackendEnv(context, amplifyClient, amplifyApp) {
    const { inputParams } = context.exeInfo;
    if (inputParams.amplify && inputParams.amplify.envName) {
        const inputEnvName = inputParams.amplify.envName;
        logger('getBackendEnv.amplifyClient.getBackendEnvironment', [
            {
                appId: amplifyApp.appId,
                environmentName: inputEnvName,
            },
        ])();
        try {
            const getBackendEnvironmentResult = await amplifyClient
                .getBackendEnvironment({
                appId: amplifyApp.appId,
                environmentName: inputEnvName,
            })
                .promise();
            context.print.info(`Backend environment ${inputEnvName} found in Amplify Console app: ${amplifyApp.name}`);
            return getBackendEnvironmentResult.backendEnvironment;
        }
        catch (e) {
            throw new amplify_cli_core_1.AmplifyError('EnvironmentNotInitializedError', {
                message: `Cannot find backend environment ${inputEnvName} in Amplify Console app: ${amplifyApp.name}`,
                details: e.message,
            }, e);
        }
    }
    let backendEnvs = [];
    let listEnvResponse = {};
    do {
        logger('getBackendEnv.amplifyClient.listBackendEnvironments', [
            {
                appId: amplifyApp.appId,
                nextToken: listEnvResponse.nextToken,
            },
        ])();
        listEnvResponse = await amplifyClient
            .listBackendEnvironments({
            appId: amplifyApp.appId,
            nextToken: listEnvResponse.nextToken,
        })
            .promise();
        backendEnvs = backendEnvs.concat(listEnvResponse.backendEnvironments);
    } while (listEnvResponse.nextToken);
    if (backendEnvs.length > 1) {
        const options = [];
        backendEnvs.forEach((env) => {
            const option = {
                name: env.environmentName,
                value: env,
                short: env.environmentName,
            };
            options.push(option);
        });
        const { selection } = await inquirer_1.default.prompt({
            type: 'list',
            name: 'selection',
            message: 'Pick a backend environment:',
            choices: options,
        });
        return selection;
    }
    if (backendEnvs.length === 1) {
        context.print.info(`Backend environment '${backendEnvs[0].environmentName}' found. Initializing...`);
        return backendEnvs[0];
    }
    throw new amplify_cli_core_1.AmplifyError('EnvironmentNotInitializedError', {
        message: `Cannot find backend environment in Amplify Console app: ${amplifyApp.name}`,
    });
}
async function downloadBackend(context, backendEnv, awsConfigInfo) {
    if (!backendEnv) {
        return;
    }
    const projectPath = process.cwd();
    const amplifyDirPath = context.amplify.pathManager.getAmplifyDirPath(projectPath);
    const tempDirPath = path_1.default.join(amplifyDirPath, '.temp');
    const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath(projectPath);
    const backendDir = context.amplify.pathManager.getBackendDirPath(projectPath);
    const zipFileName = constants_1.default.S3BackendZipFileName;
    const s3Client = new aws_sdk_1.default.S3(awsConfigInfo);
    const deploymentBucketName = backendEnv.deploymentArtifacts;
    const params = {
        Key: zipFileName,
        Bucket: deploymentBucketName,
    };
    const log = logger('downloadBackend.s3.getObject', [params]);
    let zipObject = null;
    try {
        log();
        zipObject = await s3Client.getObject(params).promise();
    }
    catch (err) {
        log(err);
        context.print.error(`Error downloading ${zipFileName} from deployment bucket: ${deploymentBucketName}, the error is: ${err.message}`);
        await context.usageData.emitError(err);
        (0, amplify_cli_core_1.exitOnNextTick)(1);
        return;
    }
    const buff = Buffer.from(zipObject.Body);
    fs_extra_1.default.ensureDirSync(tempDirPath);
    try {
        const tempFilePath = path_1.default.join(tempDirPath, zipFileName);
        fs_extra_1.default.writeFileSync(tempFilePath, buff);
        const unzippedDirPath = path_1.default.join(tempDirPath, path_1.default.basename(zipFileName, '.zip'));
        await (0, extract_zip_1.default)(tempFilePath, { dir: unzippedDirPath });
        const cliJSONFiles = glob_1.default.sync(amplify_cli_core_1.PathConstants.CLIJSONFileNameGlob, {
            cwd: unzippedDirPath,
            absolute: true,
        });
        const amplifyDir = amplify_cli_core_1.pathManager.getAmplifyDirPath();
        const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');
        if ((context.exeInfo && context.exeInfo.restoreBackend) || isPulling) {
            for (const cliJSONFilePath of cliJSONFiles) {
                const targetPath = path_1.default.join(amplifyDir, path_1.default.basename(cliJSONFilePath));
                fs_extra_1.default.moveSync(cliJSONFilePath, targetPath, { overwrite: true });
            }
        }
        else {
            for (const cliJSONFilePath of cliJSONFiles) {
                fs_extra_1.default.removeSync(cliJSONFilePath);
            }
        }
        fs_extra_1.default.copySync(unzippedDirPath, currentCloudBackendDir);
        fs_extra_1.default.copySync(unzippedDirPath, backendDir);
    }
    finally {
        fs_extra_1.default.removeSync(tempDirPath);
    }
}
//# sourceMappingURL=attach-backend.js.map