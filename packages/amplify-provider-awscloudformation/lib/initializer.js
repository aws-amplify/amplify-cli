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
exports.storeRootStackTemplate = exports.onInitSuccessful = exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const uuid_1 = require("uuid");
const vm = __importStar(require("vm2"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const moment_1 = __importDefault(require("moment"));
const path_1 = __importDefault(require("path"));
const promise_sequential_1 = __importDefault(require("promise-sequential"));
const template_description_utils_1 = require("./template-description-utils");
const push_resources_1 = require("./push-resources");
const override_manager_1 = require("./override-manager");
const amplify_service_manager_1 = require("./amplify-service-manager");
const amplifyServiceMigrate = __importStar(require("./amplify-service-migrate"));
const aws_cfn_1 = __importDefault(require("./aws-utils/aws-cfn"));
const aws_s3_1 = require("./aws-utils/aws-s3");
const configurationManager = __importStar(require("./configuration-manager"));
const constants_1 = __importDefault(require("./constants"));
const permissions_boundary_1 = require("./permissions-boundary/permissions-boundary");
const pre_push_cfn_modifier_1 = require("./pre-push-cfn-processor/pre-push-cfn-modifier");
const aws_logger_1 = require("./utils/aws-logger");
const upload_current_cloud_backend_1 = require("./utils/upload-current-cloud-backend");
const cli_extensibility_helper_1 = require("@aws-amplify/cli-extensibility-helper");
const logger = (0, aws_logger_1.fileLogger)('initializer');
const run = async (context) => {
    var _a, _b;
    await configurationManager.init(context);
    if (!context.exeInfo || context.exeInfo.isNewEnv) {
        (_a = context.exeInfo) !== null && _a !== void 0 ? _a : (context.exeInfo = { inputParams: {}, localEnvInfo: {} });
        const { projectName } = context.exeInfo.projectConfig;
        const initTemplateFilePath = path_1.default.join(__dirname, '..', 'resources', 'rootStackTemplate.json');
        const timeStamp = process.env.CIRCLECI ? (0, uuid_1.v4)().substring(0, 5) : `${(0, moment_1.default)().format('Hmmss')}`;
        const { envName = '' } = context.exeInfo.localEnvInfo;
        let stackName = normalizeStackName(`amplify-${projectName}-${envName}-${timeStamp}`);
        const awsConfigInfo = await configurationManager.getAwsConfig(context);
        await (0, permissions_boundary_1.configurePermissionsBoundaryForInit)(context);
        const amplifyServiceParams = {
            context,
            awsConfigInfo,
            projectName,
            envName,
            stackName,
        };
        const { amplifyAppId, verifiedStackName, deploymentBucketName } = await (0, amplify_service_manager_1.init)(amplifyServiceParams);
        stackName = verifiedStackName;
        const Tags = context.amplify.getTags(context);
        const authRoleName = `${stackName}-authRole`;
        const unauthRoleName = `${stackName}-unauthRole`;
        const configuration = {
            authRole: {
                roleName: authRoleName,
            },
            unauthRole: {
                roleName: unauthRoleName,
            },
        };
        let projectInitialized = false;
        let overrideFilePath = '';
        try {
            const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
            overrideFilePath = path_1.default.join(backendDir, 'awscloudformation', 'build', 'override.js');
            projectInitialized = true;
        }
        catch (e) {
        }
        if (projectInitialized && fs_extra_1.default.existsSync(overrideFilePath)) {
            try {
                const overrideCode = await fs_extra_1.default.readFile(overrideFilePath, 'utf-8');
                if (overrideCode) {
                    const sandboxNode = new vm.NodeVM({
                        console: 'inherit',
                        timeout: 5000,
                        sandbox: {},
                        require: {
                            context: 'sandbox',
                            builtin: ['path'],
                            external: true,
                        },
                    });
                    const projectInfo = (0, cli_extensibility_helper_1.getProjectInfo)();
                    await sandboxNode.run(overrideCode).override(configuration, projectInfo);
                }
            }
            catch (err) {
                throw new amplify_cli_core_1.AmplifyError('InvalidOverrideError', {
                    message: `Executing overrides failed.`,
                    details: err.message,
                    resolution: 'There may be runtime errors in your overrides file. If so, fix the errors and try again.',
                }, err);
            }
        }
        const rootStack = amplify_cli_core_1.JSONUtilities.readJson(initTemplateFilePath);
        await (0, pre_push_cfn_modifier_1.prePushCfnTemplateModifier)(rootStack);
        rootStack.Description = (0, template_description_utils_1.getDefaultTemplateDescription)(context, 'root');
        const params = {
            StackName: stackName,
            Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
            TemplateBody: amplify_cli_core_1.JSONUtilities.stringify(rootStack, { minify: (_b = context.input.options) === null || _b === void 0 ? void 0 : _b.minify }),
            Parameters: [
                {
                    ParameterKey: 'DeploymentBucketName',
                    ParameterValue: deploymentBucketName,
                },
                {
                    ParameterKey: 'AuthRoleName',
                    ParameterValue: configuration.authRole.roleName,
                },
                {
                    ParameterKey: 'UnauthRoleName',
                    ParameterValue: configuration.unauthRole.roleName,
                },
            ],
            Tags,
        };
        const eventMap = createInitEventMap(params, envName, projectName);
        const cfnItem = await new aws_cfn_1.default(context, 'init', awsConfigInfo, eventMap);
        const stackDescriptionData = await cfnItem.createResourceStack(params);
        processStackCreationData(context, amplifyAppId, stackDescriptionData);
        cloneCLIJSONForNewEnvironment(context);
    }
    else if (!context.exeInfo.isNewProject &&
        context.exeInfo.inputParams &&
        context.exeInfo.inputParams.amplify &&
        context.exeInfo.inputParams.amplify.appId) {
        await amplifyServiceMigrate.run(context);
    }
    else {
        setCloudFormationOutputInContext(context, {});
    }
};
exports.run = run;
function createInitEventMap(params, envName, projectName) {
    return {
        rootStackName: params.StackName,
        rootResources: params.Parameters.map((item) => {
            const key = item.ParameterKey;
            return {
                key: key.endsWith('Name') ? key.replace(/.{0,4}$/, '') : key,
            };
        }),
        categories: [],
        envName,
        projectName,
    };
}
const processStackCreationData = (context, amplifyAppId, stackDescriptionData) => {
    const metadata = {};
    if (stackDescriptionData.Stacks && stackDescriptionData.Stacks.length) {
        const { Outputs } = stackDescriptionData.Stacks[0];
        Outputs.forEach((element) => {
            metadata[element.OutputKey] = element.OutputValue;
        });
        if (amplifyAppId) {
            metadata[constants_1.default.AmplifyAppIdLabel] = amplifyAppId;
        }
        setCloudFormationOutputInContext(context, metadata);
    }
    else {
        throw new amplify_cli_core_1.AmplifyError('StackNotFoundError', {
            message: 'No stack data present',
        });
    }
};
const setCloudFormationOutputInContext = (context, cfnOutput) => {
    lodash_1.default.setWith(context, ['exeInfo', 'amplifyMeta', 'providers', constants_1.default.ProviderName], cfnOutput);
    const { envName } = context.exeInfo.localEnvInfo;
    if (envName) {
        const providerInfo = lodash_1.default.get(context, ['exeInfo', 'teamProviderInfo', envName, constants_1.default.ProviderName]);
        if (providerInfo) {
            lodash_1.default.merge(providerInfo, cfnOutput);
        }
        else {
            lodash_1.default.setWith(context, ['exeInfo', 'teamProviderInfo', envName, constants_1.default.ProviderName], cfnOutput);
        }
    }
};
const cloneCLIJSONForNewEnvironment = (context) => {
    if (context.exeInfo.isNewEnv && !context.exeInfo.isNewProject) {
        const { projectPath } = context.exeInfo.localEnvInfo;
        const { envName } = amplify_cli_core_1.stateManager.getLocalEnvInfo(undefined, {
            throwIfNotExist: false,
            default: {},
        });
        if (envName) {
            const currentEnvCLIJSONPath = amplify_cli_core_1.pathManager.getCLIJSONFilePath(projectPath, envName);
            if (fs_extra_1.default.existsSync(currentEnvCLIJSONPath)) {
                const newEnvCLIJSONPath = amplify_cli_core_1.pathManager.getCLIJSONFilePath(projectPath, context.exeInfo.localEnvInfo.envName);
                fs_extra_1.default.copyFileSync(currentEnvCLIJSONPath, newEnvCLIJSONPath);
            }
        }
    }
};
const onInitSuccessful = async (context) => {
    configurationManager.onInitSuccessful(context);
    if (context.exeInfo.isNewEnv) {
        await (0, exports.storeRootStackTemplate)(context);
        await (0, upload_current_cloud_backend_1.storeCurrentCloudBackend)(context);
        await storeArtifactsForAmplifyService(context);
    }
    return context;
};
exports.onInitSuccessful = onInitSuccessful;
const storeRootStackTemplate = async (context, template) => {
    var _a;
    if (template === undefined) {
        template = await (0, override_manager_1.transformRootStack)(context);
    }
    await (0, pre_push_cfn_modifier_1.prePushCfnTemplateModifier)(template);
    const projectRoot = amplify_cli_core_1.pathManager.findProjectRoot();
    const rootStackBackendBuildDir = amplify_cli_core_1.pathManager.getRootStackBuildDirPath(projectRoot);
    const rootStackCloudBackendBuildDir = amplify_cli_core_1.pathManager.getCurrentCloudRootStackDirPath(projectRoot);
    fs_extra_1.default.ensureDirSync(rootStackBackendBuildDir);
    const rootStackBackendFilePath = path_1.default.join(rootStackBackendBuildDir, push_resources_1.rootStackFileName);
    amplify_cli_core_1.JSONUtilities.writeJson(rootStackBackendFilePath, template, { minify: (_a = context.input.options) === null || _a === void 0 ? void 0 : _a.minify });
    fs_extra_1.default.copySync(path_1.default.join(rootStackBackendBuildDir, '..'), path_1.default.join(rootStackCloudBackendBuildDir, '..'));
};
exports.storeRootStackTemplate = storeRootStackTemplate;
const storeArtifactsForAmplifyService = async (context) => aws_s3_1.S3.getInstance(context).then(async (s3) => {
    const currentCloudBackendDir = amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath();
    const amplifyMetaFilePath = path_1.default.join(currentCloudBackendDir, 'amplify-meta.json');
    const backendConfigFilePath = path_1.default.join(currentCloudBackendDir, 'backend-config.json');
    const fileUploadTasks = [];
    fileUploadTasks.push(() => uploadFile(s3, amplifyMetaFilePath, 'amplify-meta.json'));
    fileUploadTasks.push(() => uploadFile(s3, backendConfigFilePath, 'backend-config.json'));
    await (0, promise_sequential_1.default)(fileUploadTasks);
});
const uploadFile = async (s3, filePath, key) => {
    if (fs_extra_1.default.existsSync(filePath)) {
        const s3Params = {
            Body: fs_extra_1.default.createReadStream(filePath),
            Key: key,
        };
        logger('uploadFile.s3.uploadFile', [{ Key: key }])();
        await s3.uploadFile(s3Params);
    }
};
const normalizeStackName = (stackName) => {
    let result = stackName.toLowerCase().replace(/[^-a-z0-9]/g, '');
    if (/^[^a-zA-Z]/.test(result) || result.length === 0) {
        result = `a${result}`;
    }
    return result;
};
//# sourceMappingURL=initializer.js.map