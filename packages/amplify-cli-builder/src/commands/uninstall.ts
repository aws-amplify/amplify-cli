import { $TSContext, isPackaged, pathManager } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { setRegPendingDelete } from '../utils/win-utils';
import { pendingDeletePath } from '../utils/win-constants';
import { hideSync } from 'hidefile';
import chalk from 'chalk';

export const run = async (context: $TSContext) => {
  if (!isPackaged) {
    context.print.warning('"uninstall" is not available in this installation of Amplify.');
    context.print.info(`Use ${chalk.blueBright('npm uninstall -g @aws-amplify/cli')} instead.`);
    return;
  }
  if (
    !context?.input?.options?.yes &&
    !(await context.amplify.confirmPrompt('Are you sure you want to uninstall the Amplify CLI?', false))
  ) {
    context.print.warning('Not removing the Amplify CLI.');
    return;
  }
  if (process.platform.startsWith('win')) {
    const binPath = path.join(pathManager.getHomeDotAmplifyDirPath(), 'bin', 'amplify.exe');
    try {
      await fs.move(binPath, pendingDeletePath, { overwrite: true });
    } catch (err) {
      throw new Error(
        `Unable to move binary out of .amplify directory. You can manually remove [${pathManager.getHomeDotAmplifyDirPath()}]`,
      );
    }
    try {
      hideSync(pendingDeletePath);
    } catch (err) {
      // swallow this error
      // hiding the file is a nice-to-have, don't need to fail on it
    }
    try {
      await setRegPendingDelete();
    } catch (err) {
      context.print.warning(err);
      context.print.warning(
        `Unable to set registry value marking Amplify binary for deletion. You can manually delete ${pendingDeletePath}.`,
      );
    }
  }
  await removeHomeDotAmplifyDir();
  context.print.success('Uninstalled the Amplify CLI');
};

const removeHomeDotAmplifyDir = async () => {
  try {
    await fs.remove(pathManager.getHomeDotAmplifyDirPath());
  } catch (ex) {
    throw new Error(`Failed to remove [${pathManager.getHomeDotAmplifyDirPath()}]\nYou'll need to manually remove this directory.`);
  }
};
