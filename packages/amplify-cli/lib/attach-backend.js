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
exports.attachBackend = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const amplify_service_helper_1 = require("./amplify-service-helper");
const a10_queryProvider_1 = require("./attach-backend-steps/a10-queryProvider");
const a20_analyzeProject_1 = require("./attach-backend-steps/a20-analyzeProject");
const a30_initFrontend_1 = require("./attach-backend-steps/a30-initFrontend");
const a40_generateFiles_1 = require("./attach-backend-steps/a40-generateFiles");
const initialize_env_1 = require("./initialize-env");
const backupAmplifyDirName = 'amplify-backup';
const attachBackend = async (context, inputParams) => {
    prepareContext(context, inputParams);
    backupAmplifyFolder();
    setupFolderStructure();
    try {
        await (0, a10_queryProvider_1.queryProvider)(context);
        if (amplify_cli_core_1.FeatureFlags.isInitialized()) {
            await amplify_cli_core_1.FeatureFlags.reloadValues();
        }
        await (0, a20_analyzeProject_1.analyzeProject)(context);
        await (0, a30_initFrontend_1.initFrontend)(context);
        await (0, a40_generateFiles_1.generateFiles)(context);
        await onSuccess(context);
    }
    catch (e) {
        removeAmplifyFolderStructure();
        restoreOriginalAmplifyFolder();
        throw new amplify_cli_core_1.AmplifyFault('PullBackendFault', {
            message: 'Failed to pull the backend.',
        }, e);
    }
};
exports.attachBackend = attachBackend;
const onSuccess = async (context) => {
    var _a;
    const { inputParams } = context.exeInfo;
    const projectPath = process.cwd();
    const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);
    if (inputParams.amplify.noOverride) {
        const backupBackendDirPath = path.join(backupAmplifyDirPath, context.amplify.constants.BackendAmplifyCLISubDirName);
        if (fs.existsSync(backupBackendDirPath)) {
            const backendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath(projectPath);
            fs.removeSync(backendDirPath);
            fs.copySync(backupBackendDirPath, backendDirPath);
        }
    }
    await (0, amplify_service_helper_1.postPullCodegen)(context);
    if (!inputParams.yes) {
        const shouldKeepAmplifyDir = ((_a = context.exeInfo.existingLocalEnvInfo) === null || _a === void 0 ? void 0 : _a.noUpdateBackend)
            ? !context.exeInfo.existingLocalEnvInfo.noUpdateBackend
            : await context.amplify.confirmPrompt('Do you plan on modifying this backend?', true);
        if (shouldKeepAmplifyDir) {
            if (amplify_cli_core_1.stateManager.currentMetaFileExists()) {
                await (0, initialize_env_1.initializeEnv)(context, amplify_cli_core_1.stateManager.getCurrentMeta());
            }
            const { envName } = context.exeInfo.localEnvInfo;
            amplify_prompts_1.printer.info('');
            amplify_prompts_1.printer.success(`Successfully pulled backend environment ${envName} from the cloud.`);
            amplify_prompts_1.printer.info("Run 'amplify pull' to sync future upstream changes.");
            amplify_prompts_1.printer.info('');
        }
        else {
            amplify_cli_core_1.stateManager.setLocalEnvInfo(process.cwd(), { ...context.exeInfo.localEnvInfo, noUpdateBackend: true });
            removeAmplifyFolderStructure(true);
            amplify_prompts_1.printer.info('');
            amplify_prompts_1.printer.success('Added backend environment config object to your project.');
            amplify_prompts_1.printer.info("Run 'amplify pull' to sync future upstream changes.");
            amplify_prompts_1.printer.info('');
        }
    }
    else if (amplify_cli_core_1.stateManager.currentMetaFileExists()) {
        await (0, initialize_env_1.initializeEnv)(context, amplify_cli_core_1.stateManager.getCurrentMeta());
    }
    const hooksDirPath = amplify_cli_core_1.pathManager.getHooksDirPath(projectPath);
    const hooksBackupDirPath = path.join(backupAmplifyDirPath, 'hooks');
    if (fs.existsSync(hooksBackupDirPath)) {
        fs.moveSync(hooksBackupDirPath, hooksDirPath, { overwrite: true });
    }
    removeBackupAmplifyFolder();
};
const backupAmplifyFolder = () => {
    const projectPath = process.cwd();
    const amplifyDirPath = amplify_cli_core_1.pathManager.getAmplifyDirPath(projectPath);
    if (fs.existsSync(amplifyDirPath)) {
        const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);
        if (fs.existsSync(backupAmplifyDirPath)) {
            throw new amplify_cli_core_1.AmplifyError('DirectoryAlreadyExistsError', {
                message: `Backup folder at ${backupAmplifyDirPath} already exists, remove the folder and retry the operation.`,
            });
        }
        try {
            fs.moveSync(amplifyDirPath, backupAmplifyDirPath);
        }
        catch (e) {
            if (e.code === 'EPERM') {
                throw new amplify_cli_core_1.AmplifyError('DirectoryError', {
                    message: `Could not attach the backend to the project.`,
                    resolution: 'Ensure that there are no applications locking the `amplify` folder and try again.',
                }, e);
            }
            throw new amplify_cli_core_1.AmplifyFault('AmplifyBackupFault', {
                message: `Could not attach the backend to the project.`,
            }, e);
        }
    }
};
const restoreOriginalAmplifyFolder = () => {
    const projectPath = process.cwd();
    const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);
    if (fs.existsSync(backupAmplifyDirPath)) {
        const amplifyDirPath = amplify_cli_core_1.pathManager.getAmplifyDirPath(projectPath);
        fs.removeSync(amplifyDirPath);
        fs.moveSync(backupAmplifyDirPath, amplifyDirPath);
    }
};
const removeBackupAmplifyFolder = () => {
    const projectPath = process.cwd();
    const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);
    fs.removeSync(backupAmplifyDirPath);
};
const setupFolderStructure = () => {
    const projectPath = process.cwd();
    const amplifyDirPath = amplify_cli_core_1.pathManager.getAmplifyDirPath(projectPath);
    const dotConfigDirPath = amplify_cli_core_1.pathManager.getDotConfigDirPath(projectPath);
    const currentCloudBackendDirPath = amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath(projectPath);
    const backendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath(projectPath);
    fs.ensureDirSync(amplifyDirPath);
    fs.ensureDirSync(dotConfigDirPath);
    fs.ensureDirSync(currentCloudBackendDirPath);
    fs.ensureDirSync(backendDirPath);
};
const removeAmplifyFolderStructure = (partial = false) => {
    const projectPath = process.cwd();
    if (partial) {
        fs.removeSync(amplify_cli_core_1.pathManager.getBackendDirPath(projectPath));
        fs.removeSync(amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath(projectPath));
    }
    else {
        const amplifyDirPath = amplify_cli_core_1.pathManager.getAmplifyDirPath(projectPath);
        fs.removeSync(amplifyDirPath);
    }
};
const prepareContext = (context, inputParams) => {
    const projectPath = process.cwd();
    context.exeInfo = {
        isNewProject: true,
        inputParams,
        projectConfig: {},
        localEnvInfo: {
            projectPath,
        },
        teamProviderInfo: {},
        existingTeamProviderInfo: amplify_cli_core_1.stateManager.getTeamProviderInfo(projectPath, {
            throwIfNotExist: false,
        }),
        existingProjectConfig: amplify_cli_core_1.stateManager.getProjectConfig(projectPath, {
            throwIfNotExist: false,
        }),
        existingLocalEnvInfo: amplify_cli_core_1.stateManager.getLocalEnvInfo(projectPath, {
            throwIfNotExist: false,
        }),
        existingLocalAwsInfo: amplify_cli_core_1.stateManager.getLocalAWSInfo(projectPath, {
            throwIfNotExist: false,
        }),
    };
    updateContextForNoUpdateBackendProjects(context);
};
const updateContextForNoUpdateBackendProjects = (context) => {
    var _a, _b;
    if ((_a = context.exeInfo.existingLocalEnvInfo) === null || _a === void 0 ? void 0 : _a.noUpdateBackend) {
        const { envName } = context.exeInfo.existingLocalEnvInfo;
        context.exeInfo.isNewProject = false;
        context.exeInfo.localEnvInfo = context.exeInfo.existingLocalEnvInfo;
        context.exeInfo.projectConfig = context.exeInfo.existingProjectConfig;
        context.exeInfo.awsConfigInfo = context.exeInfo.existingLocalAwsInfo[envName];
        context.exeInfo.awsConfigInfo.config = { ...context.exeInfo.existingLocalAwsInfo[envName] };
        context.exeInfo.inputParams = context.exeInfo.inputParams || {};
        context.exeInfo.inputParams.amplify = context.exeInfo.inputParams.amplify || {};
        context.exeInfo.inputParams.amplify.defaultEditor =
            context.exeInfo.inputParams.amplify.defaultEditor || context.exeInfo.existingLocalEnvInfo.defaultEditor;
        context.exeInfo.inputParams.amplify.projectName =
            context.exeInfo.inputParams.amplify.projectName || context.exeInfo.existingProjectConfig.projectName;
        context.exeInfo.inputParams.amplify.envName = context.exeInfo.inputParams.amplify.envName || envName;
        context.exeInfo.inputParams.amplify.frontend =
            context.exeInfo.inputParams.amplify.frontend || context.exeInfo.existingProjectConfig.frontend;
        context.exeInfo.inputParams.amplify.appId =
            context.exeInfo.inputParams.amplify.appId || ((_b = context.exeInfo.existingTeamProviderInfo[envName].awscloudformation) === null || _b === void 0 ? void 0 : _b.AmplifyAppId);
        context.exeInfo.inputParams[context.exeInfo.inputParams.amplify.frontend] =
            context.exeInfo.inputParams[context.exeInfo.inputParams.amplify.frontend] ||
                context.exeInfo.existingProjectConfig[context.exeInfo.inputParams.amplify.frontend];
    }
};
//# sourceMappingURL=attach-backend.js.map