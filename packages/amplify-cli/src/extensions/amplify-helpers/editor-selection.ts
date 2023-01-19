import * as inquirer from 'inquirer';
import { JSONUtilities } from 'amplify-cli-core';
import { merge } from 'lodash';

export const editors = [
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

export async function editorSelection(defaultEditor?) {
  const normalizedDefaultEditor = editors.findIndex(editor => editor.value === defaultEditor) > -1 ? defaultEditor : undefined;

  const editorQuestion: inquirer.ListQuestion = {
    type: 'list',
    name: 'editorSelected',
    message: 'Choose your default editor:',
    default: normalizedDefaultEditor,
    choices: editors,
  };

  const { editorSelected } = await inquirer.prompt(editorQuestion);

  hideNoManualEdit(editorSelected);

  return editorSelected;
}

// To support earlier version of the value we need to fix-up mixed case 'Code' to 'code',
// map 'code' to 'vscode' or 'idea14ce' to 'intellij'
export function normalizeEditor(editor) {
  if (editor) {
    editor = editor.toLowerCase();

    if (editor === 'idea14ce') {
      editor = 'intellij';
    } else if (editor === 'code') {
      editor = 'vscode';
    }

    editor = editors.findIndex(editorEntry => editorEntry.value === editor) > -1 ? editor : undefined;
  }

  return editor;
}

/**
 * @description Appends the settings file for a given text editor so that state files are visually hidden from the file browser.
 * @abstract When new users are stuck, many will try to edit these files and often end up creating more state management issues. This is a bad UX. Visually hiding them from their text editor will help mitigate this. Users always have the option of changing this default after project initialization.
 * @param  {} editor - text editor value code
 *
 */
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
        // If settings file exists, safely add exclude settings to it.
        const settings = JSONUtilities.readJson(workspaceSettingsPath);
        JSONUtilities.writeJson(workspaceSettingsPath, merge(exclusionRules, settings));
      } catch (error) {
        // Workspace settings file does not exist.
        // Let's create it with exclude settings.
        JSONUtilities.writeJson(workspaceSettingsPath, exclusionRules);
      }
      break;
    }
    default:
      break;
  }
}
