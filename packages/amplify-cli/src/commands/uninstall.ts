import { isPackaged, pathManager } from 'amplify-cli-core';
import execa from 'execa';
import * as fs from 'fs-extra';
import * as path from 'path';
import { pendingDeletePath, setRegPendingDelete } from '../utils/win-utils';

export const run = async context => {
  if (
    !context?.input?.options?.yes &&
    !(await context.amplify.confirmPrompt('Are you sure you want to uninstall the Amplify CLI?', false))
  ) {
    context.print.warning('Not removing the Amplify CLI.');
    return;
  }
  if (!isPackaged) {
    await uninstallNodeCli();
  } else if (process.platform.startsWith('win')) {
    const binPath = path.join(pathManager.getHomeDotAmplifyDirPath(), 'bin', 'amplify.exe');
    fs.move(binPath, pendingDeletePath);
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

const uninstallNodeCli = async () => {
  const command = 'npm uninstall -g @aws-amplify/cli';
  const { stderr } = await execa.command(command, { stdio: 'inherit' });
  if (stderr) {
    throw new Error(`[${command}] failed with [${stderr}]\nYou'll need to manually uninstall the CLI using npm.`);
  }
};

const removeHomeDotAmplifyDir = async () => {
  try {
    await fs.remove(pathManager.getHomeDotAmplifyDirPath());
  } catch (ex) {
    throw new Error(`Failed to remove [${pathManager.getHomeDotAmplifyDirPath()}]\nYou'll need to manually remove this directory.`);
  }
};
