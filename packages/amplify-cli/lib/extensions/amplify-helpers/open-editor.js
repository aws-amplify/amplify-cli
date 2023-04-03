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
exports.openEditor = void 0;
const fs = __importStar(require("fs-extra"));
const which = __importStar(require("which"));
const execa_1 = __importStar(require("execa"));
const inquirer = __importStar(require("inquirer"));
const envEditor = __importStar(require("env-editor"));
const editor_selection_1 = require("./editor-selection");
const get_env_info_1 = require("./get-env-info");
const amplify_cli_core_1 = require("amplify-cli-core");
async function openEditor(context, filePath, waitToContinue = true) {
    const continueQuestion = {
        type: 'input',
        name: 'pressKey',
        message: 'Press enter to continue',
    };
    const { defaultEditor } = (0, get_env_info_1.getEnvInfo)();
    const editorSelected = defaultEditor || (await (0, editor_selection_1.editorSelection)());
    if (editorSelected !== 'none') {
        const editorArguments = [];
        const editor = envEditor.getEditor(editorSelected);
        if (!editor) {
            context.print.error(`Selected editor '${editorSelected}' was not found in your machine. Open your favorite editor and modify the file if needed.`);
        }
        let editorPath = editor.paths.find((p) => fs.existsSync(p));
        if (!editorPath) {
            const resolvedBinary = which.sync(editor.binary, {
                nothrow: true,
            });
            if (resolvedBinary !== null) {
                editorPath = resolvedBinary;
            }
        }
        if (!editorPath) {
            context.print.warning(`Could not find selected code editor (${editorSelected}) on your machine.`);
            const openFile = await context.amplify.confirmPrompt('Try opening with system-default editor instead?', true);
            if (openFile) {
                await (0, amplify_cli_core_1.open)(filePath, { wait: waitToContinue });
                if (waitToContinue) {
                    await inquirer.prompt(continueQuestion);
                }
            }
        }
        else {
            if (editorSelected === 'vscode') {
                editorArguments.push('--goto');
            }
            editorArguments.push(filePath);
            try {
                if (!editor.isTerminalEditor) {
                    const subProcess = (0, execa_1.default)(editorPath, editorArguments, {
                        detached: true,
                        stdio: 'ignore',
                    });
                    void subProcess.on('error', () => {
                        context.print.error(`Selected editor ${editorSelected} was not found in your machine. Manually edit the file created at ${filePath}`);
                    });
                    subProcess.unref();
                    context.print.info(`Edit the file in your editor: ${filePath}`);
                    if (waitToContinue) {
                        await inquirer.prompt(continueQuestion);
                    }
                }
                else {
                    await (0, execa_1.sync)(editorPath, editorArguments, {
                        detached: true,
                        stdio: 'inherit',
                    });
                }
            }
            catch (e) {
                context.print.error(`Selected default editor not found in your machine. Manually edit the file created at ${filePath}`);
            }
        }
    }
}
exports.openEditor = openEditor;
//# sourceMappingURL=open-editor.js.map