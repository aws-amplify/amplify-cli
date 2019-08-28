const inquirer = require('inquirer');

const editors = [
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

async function editorSelection(defaultEditor) {
  defaultEditor = editors.findIndex(editor => editor.value === defaultEditor) > -1 ?
    defaultEditor : undefined;

  const editorQuestion = {
    type: 'list',
    name: 'editorSelected',
    message: 'Choose your default editor:',
    default: defaultEditor,
    choices: editors,
  };

  const { editorSelected } = await inquirer.prompt(editorQuestion);

  return editorSelected;
}

// To support earlier version of the value we need to fix-up mixed case 'Code' to 'code',
// map 'code' to 'vscode' or 'idea14ce' to 'intellij'
function normalizeEditor(editor) {
  if (editor) {
    editor = editor.toLowerCase();

    if (editor === 'idea14ce') {
      editor = 'intellij';
    } else if (editor === 'code') {
      editor = 'vscode';
    }

    editor = editors.findIndex(editorEntry => editorEntry.value === editor) > -1 ?
      editor : undefined;
  }

  return editor;
}

module.exports = {
  editors,
  normalizeEditor,
  editorSelection,
};
