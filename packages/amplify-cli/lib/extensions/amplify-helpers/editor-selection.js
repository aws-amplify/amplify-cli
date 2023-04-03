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
exports.normalizeEditor = exports.editorSelection = exports.editors = void 0;
const inquirer = __importStar(require("inquirer"));
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = require("lodash");
exports.editors = [
    {
        name: 'Visual Studio Code',
        value: 'vscode',
    },
    {
        name: 'Android Studio',
        value: 'android-studio',
    },
    {
        name: 'Xcode (macOS only)',
        value: 'xcode',
    },
    {
        name: 'Atom Editor',
        value: 'atom',
    },
    {
        name: 'Sublime Text',
        value: 'sublime',
    },
    {
        name: 'IntelliJ IDEA',
        value: 'intellij',
    },
    {
        name: 'Vim (via Terminal, macOS only)',
        value: 'vim',
    },
    {
        name: 'Emacs (via Terminal, macOS only)',
        value: 'emacs',
    },
    {
        name: 'None',
        value: 'none',
    },
];
async function editorSelection(defaultEditor) {
    const normalizedDefaultEditor = exports.editors.findIndex((editor) => editor.value === defaultEditor) > -1 ? defaultEditor : undefined;
    const editorQuestion = {
        type: 'list',
        name: 'editorSelected',
        message: 'Choose your default editor:',
        default: normalizedDefaultEditor,
        choices: exports.editors,
    };
    const { editorSelected } = await inquirer.prompt(editorQuestion);
    hideNoManualEdit(editorSelected);
    return editorSelected;
}
exports.editorSelection = editorSelection;
function normalizeEditor(editor) {
    if (editor) {
        editor = editor.toLowerCase();
        if (editor === 'idea14ce') {
            editor = 'intellij';
        }
        else if (editor === 'code') {
            editor = 'vscode';
        }
        editor = exports.editors.findIndex((editorEntry) => editorEntry.value === editor) > -1 ? editor : undefined;
    }
    return editor;
}
exports.normalizeEditor = normalizeEditor;
function hideNoManualEdit(editor) {
    switch (editor) {
        case 'vscode': {
            const workspaceSettingsPath = '.vscode/settings.json';
            const exclusionRules = {
                'files.exclude': {
                    'amplify/.config': true,
                    'amplify/**/*-parameters.json': true,
                    'amplify/**/amplify.state': true,
                    'amplify/**/transform.conf.json': true,
                    'amplify/#current-cloud-backend': true,
                    'amplify/backend/amplify-meta.json': true,
                    'amplify/backend/awscloudformation': true,
                },
            };
            try {
                const settings = amplify_cli_core_1.JSONUtilities.readJson(workspaceSettingsPath);
                amplify_cli_core_1.JSONUtilities.writeJson(workspaceSettingsPath, (0, lodash_1.merge)(exclusionRules, settings));
            }
            catch (error) {
                amplify_cli_core_1.JSONUtilities.writeJson(workspaceSettingsPath, exclusionRules);
            }
            break;
        }
        default:
            break;
    }
}
//# sourceMappingURL=editor-selection.js.map