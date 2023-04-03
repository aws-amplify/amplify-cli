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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeProject = void 0;
const path = __importStar(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const editor_selection_1 = require("../extensions/amplify-helpers/editor-selection");
const project_name_validation_1 = require("../extensions/amplify-helpers/project-name-validation");
const get_env_info_1 = require("../extensions/amplify-helpers/get-env-info");
const s0_analyzeProject_1 = require("../init-steps/s0-analyzeProject");
const get_frontend_plugins_1 = require("../extensions/amplify-helpers/get-frontend-plugins");
const execution_manager_1 = require("../execution-manager");
const amplify_cli_core_1 = require("amplify-cli-core");
async function analyzeProject(context) {
    context.exeInfo.projectConfig = amplify_cli_core_1.stateManager.getProjectConfig(undefined, {
        throwIfNotExist: false,
    });
    context.exeInfo.localEnvInfo = (0, get_env_info_1.getEnvInfo)();
    const projectPath = process.cwd();
    Object.assign(context.exeInfo.localEnvInfo, { projectPath });
    const { projectName } = context.exeInfo.projectConfig;
    const { defaultEditor, envName } = context.exeInfo.localEnvInfo;
    context.print.info('');
    await (0, s0_analyzeProject_1.displayConfigurationDefaults)(context, projectName, envName, defaultEditor);
    const frontendPlugins = (0, get_frontend_plugins_1.getFrontendPlugins)(context);
    let frontend = context.exeInfo.projectConfig.frontend;
    if (!frontend) {
        frontend = 'javascript';
    }
    const frontendModule = await Promise.resolve().then(() => __importStar(require(frontendPlugins[frontend])));
    await frontendModule.displayFrontendDefaults(context, projectPath);
    context.print.info('');
    const envAwsInfo = amplify_cli_core_1.stateManager.getLocalAWSInfo();
    if (typeof (envAwsInfo === null || envAwsInfo === void 0 ? void 0 : envAwsInfo[envName]) === 'object') {
        const awsInfo = envAwsInfo[envName];
        if (awsInfo.useProfile && awsInfo.profileName) {
            await displayProfileSetting(context, awsInfo['profileName']);
            context.print.info('');
        }
    }
    await displayContainersInfo(context);
    context.print.info('');
    await configureConfigurationSetting(context);
    await configureProjectName(context);
    await configureEditor(context);
    return context;
}
exports.analyzeProject = analyzeProject;
function displayProfileSetting(context, profileName) {
    context.print.info('AWS Profile setting');
    context.print.info(`| Selected profile: ${profileName}`);
}
function displayContainersInfo(context) {
    context.print.info('Advanced: Container-based deployments');
    const containerDeploymentStatus = (0, execution_manager_1.isContainersEnabled)(context) ? 'Yes' : 'No';
    context.print.info(`| Leverage container-based deployments: ${containerDeploymentStatus}`);
}
async function configureConfigurationSetting(context) {
    if (context.exeInfo.inputParams.amplify.headless) {
        return;
    }
    const configureSettingQuestion = {
        type: 'list',
        name: 'configurationSetting',
        message: 'Which setting do you want to configure?',
        choices: [
            { name: 'Project information', value: 'project' },
            { name: 'AWS Profile setting', value: 'profile' },
            { name: 'Advanced: Container-based deployments', value: 'containers' },
        ],
        default: 'project',
    };
    const { configurationSetting } = await inquirer_1.default.prompt(configureSettingQuestion);
    if (configurationSetting === 'containers') {
        context.exeInfo.inputParams.yes = true;
        context.exeInfo.inputParams.containerSetting = true;
    }
    if (configurationSetting === 'profile') {
        context.exeInfo.inputParams.yes = true;
        context.exeInfo.inputParams.profileSetting = true;
    }
}
async function configureProjectName(context) {
    let { projectName } = context.exeInfo.projectConfig;
    if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.projectName) {
        projectName = (0, project_name_validation_1.normalizeProjectName)(context.exeInfo.inputParams.amplify.projectName);
    }
    else {
        if (!projectName) {
            const projectPath = process.cwd();
            projectName = (0, project_name_validation_1.normalizeProjectName)(path.basename(projectPath));
        }
        if (!context.exeInfo.inputParams.yes) {
            const projectNameQuestion = {
                type: 'input',
                name: 'inputProjectName',
                message: 'Enter a name for the project',
                default: projectName,
                validate: (input) => (0, project_name_validation_1.isProjectNameValid)(input) || 'Project name should be between 3 and 20 characters and alphanumeric',
            };
            const answer = await inquirer_1.default.prompt(projectNameQuestion);
            projectName = answer.inputProjectName;
        }
    }
    Object.assign(context.exeInfo.projectConfig, { projectName });
}
async function configureEditor(context) {
    let { defaultEditor } = context.exeInfo.localEnvInfo;
    if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.defaultEditor) {
        defaultEditor = (0, editor_selection_1.normalizeEditor)(context.exeInfo.inputParams.amplify.editor);
    }
    else if (!context.exeInfo.inputParams.yes) {
        defaultEditor = await (0, editor_selection_1.editorSelection)(defaultEditor);
    }
    Object.assign(context.exeInfo.localEnvInfo, { defaultEditor });
}
//# sourceMappingURL=c0-analyzeProject.js.map