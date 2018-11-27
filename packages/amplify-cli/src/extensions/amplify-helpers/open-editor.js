async function openEditor(context, filePath) {
  const inquirer = require('inquirer');
  const openInEditor = require('open-in-editor');
  const { editorSelection } = require('./editor-selection');
  const { getProjectDetails } = require('./get-project-details');

  const continueQuestion = {
    type: 'input',
    name: 'pressKey',
    message: 'Press enter to continue',
  };
  let editorSelected;

  // Check if default editor is chosen in init step
  const { projectConfig } = getProjectDetails();

  if (projectConfig.defaultEditor) {
    editorSelected = projectConfig.defaultEditor;
  } else {
    editorSelected = await editorSelection();
  }

  if (editorSelected !== 'none') {
    const editorOption = {
      editor: editorSelected,
    };

    const editor = openInEditor.configure(editorOption, (err) => {
      console.error(`Selected editor not found in your machine. Please open your favorite editor and modify the file if needed: ${err}`);
    });

    return editor.open(filePath)
      .then(async () => {
        context.print.info(`Please edit the file in your editor: ${filePath}`);
      }, async () => {
        context.print.error(`Selected default editor not found in your machine. Please manually edit the file created at ${filePath}`);
      })
      .then(async () => await inquirer.prompt(continueQuestion));
  }
  context.print.error(`Please manually edit the file created at ${filePath}`);
  await inquirer.prompt(continueQuestion);
}

module.exports = {
  openEditor,
};
