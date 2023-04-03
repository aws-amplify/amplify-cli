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
exports.analyzeProject = exports.displayConfigurationDefaults = exports.analyzeProjectHeadless = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const inquirer = __importStar(require("inquirer"));
const path = __importStar(require("path"));
const constants_1 = require("../extensions/amplify-helpers/constants");
const editor_selection_1 = require("../extensions/amplify-helpers/editor-selection");
const get_frontend_plugins_1 = require("../extensions/amplify-helpers/get-frontend-plugins");
const project_name_validation_1 = require("../extensions/amplify-helpers/project-name-validation");
const s1_initFrontend_1 = require("./s1-initFrontend");
const analyzeProjectHeadless = async (context) => {
    var _a, _b;
    const projectPath = process.cwd();
    const projectName = path.basename(projectPath);
    const env = getDefaultEnv(context);
    setProjectConfig(context, projectName);
    setExeInfo(context, projectPath, undefined, env);
    const { frontend } = (_b = (_a = context === null || context === void 0 ? void 0 : context.parameters) === null || _a === void 0 ? void 0 : _a.options) !== null && _b !== void 0 ? _b : {};
    if (!frontend) {
        context.print.warning('No frontend specified. Defaulting to android.');
        context.exeInfo.projectConfig.frontend = 'android';
    }
    else {
        context.exeInfo.projectConfig.frontend = frontend;
    }
};
exports.analyzeProjectHeadless = analyzeProjectHeadless;
const displayConfigurationDefaults = (context, defaultProjectName, defaultEnv, defaultEditorName) => {
    context.print.info('Project information');
    context.print.info(`| Name: ${defaultProjectName}`);
    context.print.info(`| Environment: ${defaultEnv}`);
    context.print.info(`| Default editor: ${defaultEditorName}`);
};
exports.displayConfigurationDefaults = displayConfigurationDefaults;
const setConfigurationDefaults = (context, projectPath, defaultProjectName, defaultEnv, defaultEditor) => {
    setExeInfo(context, projectPath, defaultEditor, defaultEnv);
    setProjectConfig(context, defaultProjectName);
    context.exeInfo.inputParams.amplify = context.exeInfo.inputParams.amplify || {};
    context.exeInfo.inputParams.amplify.projectName = defaultProjectName;
    context.exeInfo.inputParams.amplify.envName = defaultEnv;
    context.exeInfo.inputParams.amplify.defaultEditor = defaultEditor;
};
const displayAndSetDefaults = async (context, projectPath, projectName) => {
    var _a, _b, _c;
    const defaultProjectName = projectName;
    const defaultEnv = getDefaultEnv(context);
    let defaultEditor;
    if ((_c = (_b = (_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.inputParams) === null || _b === void 0 ? void 0 : _b.amplify) === null || _c === void 0 ? void 0 : _c.defaultEditor) {
        defaultEditor = (0, editor_selection_1.normalizeEditor)(context.exeInfo.inputParams.amplify.defaultEditor);
    }
    else {
        defaultEditor = editor_selection_1.editors.length > 0 ? editor_selection_1.editors[0].value : 'vscode';
    }
    const editorIndex = editor_selection_1.editors.findIndex((editorEntry) => editorEntry.value === defaultEditor);
    const defaultEditorName = editorIndex > -1 ? editor_selection_1.editors[editorIndex].name : 'Visual Studio Code';
    context.print.success('The following configuration will be applied:');
    context.print.info('');
    (0, exports.displayConfigurationDefaults)(context, defaultProjectName, defaultEnv, defaultEditorName);
    const frontendPlugins = (0, get_frontend_plugins_1.getFrontendPlugins)(context);
    const defaultFrontend = (0, s1_initFrontend_1.getSuitableFrontend)(context, frontendPlugins, projectPath);
    const frontendModule = await Promise.resolve().then(() => __importStar(require(frontendPlugins[defaultFrontend])));
    await frontendModule.displayFrontendDefaults(context, projectPath);
    context.print.info('');
    if (context.exeInfo.inputParams.yes || (await context.amplify.confirmPrompt('Initialize the project with the above configuration?'))) {
        setConfigurationDefaults(context, projectPath, defaultProjectName, defaultEnv, defaultEditorName);
        await frontendModule.setFrontendDefaults(context, projectPath);
    }
};
const analyzeProject = async (context) => {
    var _a, _b, _c, _d;
    if (!((_a = context.parameters.options) === null || _a === void 0 ? void 0 : _a.app) || !((_b = context.parameters.options) === null || _b === void 0 ? void 0 : _b.quickstart)) {
        context.print.warning('Note: It is recommended to run this command from the root of your app directory');
    }
    const projectPath = process.cwd();
    context.exeInfo.isNewProject = isNewProject(context);
    const projectName = await getProjectName(context);
    if (context.exeInfo.isNewProject && context.parameters.command !== 'env') {
        await displayAndSetDefaults(context, projectPath, projectName);
    }
    const envName = await getEnvName(context);
    let defaultEditor = getDefaultEditor();
    if (!defaultEditor) {
        defaultEditor = await getEditor(context);
    }
    context.exeInfo.isNewEnv = isNewEnv(envName);
    context.exeInfo.forcePush = !!((_d = (_c = context === null || context === void 0 ? void 0 : context.parameters) === null || _c === void 0 ? void 0 : _c.options) === null || _d === void 0 ? void 0 : _d.forcePush);
    if (context.exeInfo.isNewEnv && !context.exeInfo.isNewProject) {
        const currentLocalEnvInfo = amplify_cli_core_1.stateManager.getLocalEnvInfo(undefined, {
            throwIfNotExist: false,
        });
        if (currentLocalEnvInfo) {
            context.exeInfo.sourceEnvName = currentLocalEnvInfo.envName;
        }
    }
    setProjectConfig(context, projectName);
    setExeInfo(context, projectPath, defaultEditor, envName);
    return context;
};
exports.analyzeProject = analyzeProject;
const setProjectConfig = (context, projectName) => {
    context.exeInfo.isNewProject = isNewProject(context);
    context.exeInfo.projectConfig = {
        projectName,
        version: constants_1.amplifyCLIConstants.CURRENT_PROJECT_CONFIG_VERSION,
    };
};
const setExeInfo = (context, projectPath, defaultEditor, envName) => {
    context.exeInfo.localEnvInfo = {
        projectPath,
        defaultEditor,
        envName,
    };
    context.exeInfo.teamProviderInfo = {};
    return context;
};
const getProjectName = async (context) => {
    let projectName;
    const projectPath = process.cwd();
    if (!context.exeInfo.isNewProject) {
        const projectConfig = amplify_cli_core_1.stateManager.getProjectConfig(projectPath);
        projectName = projectConfig.projectName;
        return projectName;
    }
    if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.projectName) {
        projectName = (0, project_name_validation_1.normalizeProjectName)(context.exeInfo.inputParams.amplify.projectName);
    }
    else {
        projectName = (0, project_name_validation_1.normalizeProjectName)(path.basename(projectPath));
        if (!context.exeInfo.inputParams.yes) {
            const projectNameQuestion = {
                type: 'input',
                name: 'inputProjectName',
                message: 'Enter a name for the project',
                default: projectName,
                validate: (input) => (0, project_name_validation_1.isProjectNameValid)(input) || 'Project name should be between 3 and 20 characters and alphanumeric',
            };
            const answer = await inquirer.prompt(projectNameQuestion);
            projectName = answer.inputProjectName;
        }
    }
    return projectName;
};
const getEditor = async (context) => {
    var _a;
    let editor;
    if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.defaultEditor) {
        editor = (0, editor_selection_1.normalizeEditor)(context.exeInfo.inputParams.amplify.defaultEditor);
    }
    else if (!context.exeInfo.inputParams.yes) {
        editor = await (0, editor_selection_1.editorSelection)(editor);
    }
    if (!editor) {
        editor = (_a = context.exeInfo.localEnvInfo) === null || _a === void 0 ? void 0 : _a.defaultEditor;
    }
    return editor;
};
const isEnvNameValid = (inputEnvName) => /^[a-z]{2,10}$/.test(inputEnvName);
const INVALID_ENV_NAME_MSG = 'Environment name must be between 2 and 10 characters, and lowercase only.';
const getDefaultEnv = (context) => {
    var _a, _b, _c;
    let defaultEnv = 'dev';
    if ((_c = (_b = (_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.inputParams) === null || _b === void 0 ? void 0 : _b.amplify) === null || _c === void 0 ? void 0 : _c.envName) {
        if (isEnvNameValid(context.exeInfo.inputParams.amplify.envName)) {
            defaultEnv = context.exeInfo.inputParams.amplify.envName;
            return defaultEnv;
        }
        throw new amplify_cli_core_1.AmplifyError('EnvironmentNameError', {
            message: `Invalid environment name: ${context.exeInfo.inputParams.amplify.envName}`,
            resolution: INVALID_ENV_NAME_MSG,
        });
    }
    if (isNewProject(context) || !context.amplify.getAllEnvs().includes(defaultEnv)) {
        return defaultEnv;
    }
    return undefined;
};
const getEnvName = async (context) => {
    let envName;
    if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.envName) {
        if (isEnvNameValid(context.exeInfo.inputParams.amplify.envName)) {
            ({ envName } = context.exeInfo.inputParams.amplify);
            return envName;
        }
        throw new amplify_cli_core_1.AmplifyError('ProjectInitError', {
            message: `Invalid environment name: ${context.exeInfo.inputParams.amplify.envName}`,
            resolution: INVALID_ENV_NAME_MSG,
        });
    }
    else if (context.exeInfo.inputParams && context.exeInfo.inputParams.yes) {
        throw new amplify_cli_core_1.AmplifyError('ProjectInitError', {
            message: `Invalid environment name: ${context.exeInfo.inputParams.amplify.envName}`,
            resolution: INVALID_ENV_NAME_MSG,
        });
    }
    const newEnvQuestion = async () => {
        const defaultEnvName = getDefaultEnv(context);
        const envNameQuestion = {
            type: 'input',
            name: 'envName',
            message: 'Enter a name for the environment',
            default: defaultEnvName,
            validate: (input) => (!isEnvNameValid(input) ? INVALID_ENV_NAME_MSG : true),
        };
        ({ envName } = await inquirer.prompt(envNameQuestion));
    };
    if (isNewProject(context)) {
        await newEnvQuestion();
    }
    else {
        const allEnvs = context.amplify.getAllEnvs();
        const envAddExec = checkEnvAddExec(context);
        if (allEnvs.length > 0 && envAddExec === false) {
            if (await context.amplify.confirmPrompt('Do you want to use an existing environment?')) {
                const envQuestion = {
                    type: 'list',
                    name: 'envName',
                    message: 'Choose the environment you would like to use:',
                    choices: allEnvs,
                };
                ({ envName } = await inquirer.prompt(envQuestion));
            }
            else {
                await newEnvQuestion();
            }
        }
        else if (envAddExec === true && context.parameters.first) {
            envName = context.parameters.first;
        }
        else {
            await newEnvQuestion();
        }
    }
    return envName;
};
const isNewEnv = (envName) => {
    const cwd = process.cwd();
    const readOptions = { throwIfNotExist: false, default: {} };
    const localAwsInfoEnvs = Object.keys(amplify_cli_core_1.stateManager.getLocalAWSInfo(cwd, readOptions));
    const tpiEnvs = Object.keys(amplify_cli_core_1.stateManager.getTeamProviderInfo(cwd, readOptions));
    const allEnvs = Array.from(new Set([...localAwsInfoEnvs, ...tpiEnvs]));
    return !allEnvs.includes(envName);
};
const isNewProject = (context) => {
    let newProject = true;
    const projectPath = process.cwd();
    const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath(projectPath);
    if (fs.existsSync(projectConfigFilePath)) {
        newProject = false;
    }
    return newProject;
};
const getDefaultEditor = () => {
    const projectPath = process.cwd();
    const localEnvInfo = amplify_cli_core_1.stateManager.getLocalEnvInfo(projectPath, {
        throwIfNotExist: false,
        default: {},
    });
    return localEnvInfo.defaultEditor;
};
const checkEnvAddExec = (context) => context.parameters.command === 'env' && context.parameters.array[0] === 'add';
//# sourceMappingURL=s0-analyzeProject.js.map