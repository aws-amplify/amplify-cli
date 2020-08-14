import * as fs from 'fs-extra';
import execa, { sync as execaSync } from 'execa';
import * as inquirer from 'inquirer';
import * as envEditor from 'env-editor';
import { editorSelection } from './editor-selection';
import { getEnvInfo } from './get-env-info';

export async function openEditor(context, filePath, waitToContinue = true) {
  const continueQuestion: inquirer.InputQuestion = {
    type: 'input',
    name: 'pressKey',
    message: 'Press enter to continue',
  };

  // Check if default editor is chosen in init step
  const { defaultEditor } = getEnvInfo();

  const editorSelected = defaultEditor || (await editorSelection());

  if (editorSelected !== 'none') {
    const editorArguments: string[] = [];
    const editor = envEditor.getEditor(editorSelected);

    if (!editor) {
      console.error(
        `Selected editor '${editorSelected}' was not found in your machine. Please open your favorite editor and modify the file if needed.`,
      );
    }
    const editorPath = editor.paths.find(p => fs.existsSync(p));

    if (editorSelected === 'vscode') {
      editorArguments.push('--goto');
    }

    editorArguments.push(filePath);

    try {
      if (!editor.isTerminalEditor) {
        const subProcess = execa(editorPath || editor.binary, editorArguments, {
          detached: true,
          stdio: 'ignore',
        });

        subProcess.on('error', err => {
          context.print.error(
            `Selected  editor ${editorSelected} was not found in your machine. Please manually edit the file created at ${filePath}`,
          );
        });

        subProcess.unref();
        context.print.info(`Please edit the file in your editor: ${filePath}`);
        if (waitToContinue) {
          await inquirer.prompt(continueQuestion);
        }
      } else {
        await execaSync(editorPath || editor.binary, editorArguments, {
          detached: true,
          stdio: 'inherit',
        });
      }
    } catch (e) {
      context.print.error(`Selected default editor not found in your machine. Please manually edit the file created at ${filePath}`);
    }
  }
}
