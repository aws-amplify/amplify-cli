const inquirer = require('inquirer');

async function editorSelection(defaultEditor) {
  const editorQuestion = {
    type: 'list',
    name: 'editorSelected',
    message: 'Choose your default editor:',
    default: defaultEditor,
    choices: [
      {
        name: 'Sublime Text',
        value: 'sublime',
      },
      {
        name: 'Atom Editor',
        value: 'atom',
      },
      {
        name: 'Visual Studio Code',
        value: 'code',
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

    ],
  };

  const { editorSelected } = await inquirer.prompt(editorQuestion);

  return editorSelected;
}

module.exports = {
  editorSelection,
};
