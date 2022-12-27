import * as fs from 'fs-extra';
import * as which from 'which';
import open from 'open';
import execa, { sync as execaSync } from 'execa';
import * as inquirer from 'inquirer';
import * as envEditor from 'env-editor';
import { editorSelection } from './editor-selection';
import { getEnvInfo } from './get-env-info';
import { $TSContext } from 'amplify-cli-core';

export async function openEditor(context: $TSContext, filePath: string, waitToContinue = true): Promise<void> {
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

    const editor: envEditor.Editor = envEditor.getEditor(editorSelected);

    if (!editor) {
      context.print.error(
        `Selected editor '${editorSelected}' was not found in your machine. Open your favorite editor and modify the file if needed.`,
      );
    }

    let editorPath: string | undefined = editor.paths.find(p => fs.existsSync(p));

    // Check if the binary can be located with which
    if (!editorPath) {
      const resolvedBinary = which.sync(editor.binary, {
        nothrow: true,
      });

      if (resolvedBinary !== null) {
        editorPath = resolvedBinary;
      }
    }

    // In case if the selected editor was found.
    if (!editorPath) {
      context.print.warning(`Couldn’t find selected code editor (${editorSelected}) on your machine.`);

      const openFile = await context.amplify.confirmPrompt('Try opening with system-default editor instead?', true);

      if (openFile) {
        await open(filePath, { wait: waitToContinue });

        if (waitToContinue) {
          await inquirer.prompt(continueQuestion);
        }
      }
    } else {
      if (editorSelected === 'vscode') {
        editorArguments.push('--goto');
      }

      editorArguments.push(filePath);

      try {
        if (!editor.isTerminalEditor) {
          const subProcess = execa(editorPath, editorArguments, {
            detached: true,
            stdio: 'ignore',
          });

          subProcess.on('error', err => {
            context.print.error(
              `Selected editor ${editorSelected} was not found in your machine. Manually edit the file created at ${filePath}`,
            );
          });

          subProcess.unref();
          context.print.info(`Edit the file in your editor: ${filePath}`);
          if (waitToContinue) {
            await inquirer.prompt(continueQuestion);
          }
        } else {
          await execaSync(editorPath, editorArguments, {
            detached: true,
            stdio: 'inherit',
          });
        }
      } catch (e) {
        context.print.error(`Selected default editor not found in your machine. Manually edit the file created at ${filePath}`);
      }
    }
  }
}
