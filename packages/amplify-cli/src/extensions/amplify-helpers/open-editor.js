const childProcess = require('child_process');
const inquirer = require('inquirer');
const envEditor = require('env-editor');
const { editorSelection } = require('./editor-selection');
const { getEnvInfo } = require('./get-env-info');
const fs = require('fs-extra');

async function openEditor(context, filePath) {
  const continueQuestion = {
    type: 'input',
    name: 'pressKey',
    message: 'Press enter to continue',
  };


  // Check if default editor is chosen in init step
  const { defaultEditor } = getEnvInfo();

  const editorSelected = defaultEditor || await editorSelection();

  if (editorSelected !== 'none') {
    const editorArguments = [];
    const editor = envEditor.getEditor(editorSelected);

    if (!editor) {
      console.error(`Selected editor '${editorSelected}' was not found in your machine. Please open your favorite editor and modify the file if needed.`);
    }
    const editorPath = editor.paths.find(p => fs.existsSync(p));

    if (editorSelected === 'vscode') {
      editorArguments.push('--goto');
    }

    editorArguments.push(filePath);

    try {
      if (!editor.isTerminalEditor) {
        const subProcess = childProcess.spawn(editorPath || editor.binary, editorArguments, {
          detached: true,
          stdio: 'ignore',
        });

        subProcess.on('error', () => {
          context.print.error(`Selected  editor ${editorSelected} was not found in your machine. Please manually edit the file created at ${filePath}`);
        });

        subProcess.unref();
        context.print.info(`Please edit the file in your editor: ${filePath}`);
        await inquirer.prompt(continueQuestion);
      } else {
        childProcess.spawnSync(editorPath || editor.binary, editorArguments, {
          detached: true,
          stdio: 'inherit',
        });
      }
    } catch (e) {
      context.print.error(`Selected default editor not found in your machine. Please manually edit the file created at ${filePath}`);
    }
  }
}

module.exports = {
  openEditor,
};
