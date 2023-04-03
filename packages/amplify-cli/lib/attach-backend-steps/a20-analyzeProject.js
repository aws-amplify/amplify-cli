"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeProject = void 0;
const editor_selection_1 = require("../extensions/amplify-helpers/editor-selection");
const constants_1 = require("../extensions/amplify-helpers/constants");
const amplify_cli_core_1 = require("amplify-cli-core");
const project_name_validation_1 = require("../extensions/amplify-helpers/project-name-validation");
async function analyzeProject(context) {
    var _a, _b;
    let defaultEditor = getDefaultEditor();
    if (!defaultEditor) {
        defaultEditor = await getEditor(context);
    }
    context.exeInfo.projectConfig.projectName = (0, project_name_validation_1.normalizeProjectName)(context.exeInfo.projectConfig.projectName);
    context.exeInfo.forcePush = !!((_b = (_a = context === null || context === void 0 ? void 0 : context.parameters) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b.forcePush);
    context.exeInfo.projectConfig.version = constants_1.amplifyCLIConstants.CURRENT_PROJECT_CONFIG_VERSION;
    context.exeInfo.localEnvInfo.defaultEditor = defaultEditor;
    return context;
}
exports.analyzeProject = analyzeProject;
async function getEditor(context) {
    let editor;
    if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.defaultEditor) {
        editor = (0, editor_selection_1.normalizeEditor)(context.exeInfo.inputParams.amplify.defaultEditor);
    }
    else if (!context.exeInfo.inputParams.yes) {
        editor = await (0, editor_selection_1.editorSelection)(editor);
    }
    return editor;
}
function getDefaultEditor() {
    const projectPath = process.cwd();
    const localEnvInfo = amplify_cli_core_1.stateManager.getLocalEnvInfo(projectPath, {
        throwIfNotExist: false,
        default: {},
    });
    return localEnvInfo.defaultEditor;
}
//# sourceMappingURL=a20-analyzeProject.js.map