import { prompt } from 'enquirer';
import { normalizeEditor } from '../extensions/amplify-helpers/editor-selection';

export const defaultEditors = [
  {
    name: 'Visual Studio Code',
    value: 'vscode',
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
    name: 'Vim (via Terminal, Mac OS only)',
    value: 'vim',
  },
  {
    name: 'Emacs (via Terminal, Mac OS only)',
    value: 'emacs',
  },
  {
    name: 'None',
    value: 'none',
  },
];

export async function editorSelect(editors = defaultEditors, initialEditor?) {
  const normalizedInitialEditor = normalizeEditor(initialEditor);
  const editorPrompt = {
    type: 'select',
    name: 'editorSelected',
    message: 'Choose your default editor:',
    initial: normalizedInitialEditor,
    choices: editors,
  };
  const { editorSelected } = await prompt(editorPrompt);
  return editorSelected;
}

export function normalizeEditor(editor) {
  let normalizedEditor = editor;
  if (normalizedEditor) {
    normalizedEditor = normalizedEditor.toLowerCase();

    if (normalizedEditor === 'idea14ce') {
      normalizedEditor = 'intellij';
    } else if (normalizedEditor === 'code') {
      normalizedEditor = 'vscode';
    }

    normalizedEditor = defaultEditors.findIndex(editorEntry => editorEntry.value === normalizedEditor) > -1 ? normalizedEditor : undefined;
  }

  return normalizedEditor;
}
