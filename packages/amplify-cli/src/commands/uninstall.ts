import { isPackaged, pathManager } from 'amplify-cli-core';
import execa from 'execa';
import * as fs from 'fs-extra';

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
