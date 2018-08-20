const inquirer = require('inquirer');

async function editorSelection(defaultEditor) {
  const editors = [
    {
      name: 'Sublime Text',
      value: 'sublime',
    },
    {
      name: 'Visual Studio Code',
      value: 'code',
    },
    {
      name: 'Atom Editor',
      value: 'atom',
    },
    {
      name: 'IDEA 14 CE',
      value: 'idea14ce',
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

module.exports = {
  editorSelection,
};
