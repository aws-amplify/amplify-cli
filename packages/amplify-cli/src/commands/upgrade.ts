import { $TSContext, isPackaged, pathManager } from 'amplify-cli-core';
import execa from 'execa';
import fetch from 'node-fetch';
import { gt } from 'semver';
import * as path from 'path';
import * as fs from 'fs-extra';
import ora from 'ora';
import { oldVersionPath } from '../utils/win-constants';
import chalk from 'chalk';

const binUrl = (version: string, platform: 'macos' | 'win.exe' | 'linux') =>
  `https://github.com/aws-amplify/amplify-cli/releases/download/v${version}/amplify-pkg-${platform}`;
const latestVersionUrl = 'https://api.github.com/repos/aws-amplify/amplify-cli/releases/latest';

export const run = async (context: $TSContext) => {
  if (!isPackaged) {
    context.print.warning(
      `"upgrade" is not supported in this installation of Amplify.\nUse ${chalk.blueBright('npm i -g @aws-amplify/cli')}`,
    );
    return;
  }
  const { version: thisVersion } = require('../../package.json');
  if (typeof thisVersion !== 'string') {
    throw new Error('Cannot determine current CLI version. Try uninstalling and reinstalling the CLI.');
  }
  const latestVersion = await getLatestVersion();
  if (gt(latestVersion, thisVersion)) {
    await upgradeCli(latestVersion);
    context.print.success(`Successfully upgraded to Amplify CLI version ${latestVersion}!`);
  } else {
    context.print.info('This is the latest Amplify CLI version.');
  }
};

const upgradeCli = async (version: string) => {
  const isWin = process.platform.startsWith('win');
  const binPath = path.join(pathManager.getHomeDotAmplifyDirPath(), 'bin', isWin ? 'amplify.exe' : 'amplify');
  const platformSuffix = isWin ? 'win.exe' : process.platform === 'darwin' ? 'macos' : 'linux';
  const url = binUrl(version, platformSuffix);
  const spinner = ora();

  if (isWin) {
    await fs.move(binPath, oldVersionPath);
  }

  spinner.start('Downloading latest Amplify CLI version...');
  const response = await fetch(url);
  if (response.status >= 400) {
    throw new Error(`${response.status}: Request to ${url} failed:\n${JSON.stringify(response.json(), null, 2)}`);
  }
  const bin = await response.buffer();
  spinner.succeed('Download complete!');
  await fs.writeFile(binPath, bin);
  await fs.chmod(binPath, '700');
};

const getLatestVersion = async (): Promise<string> => {
  const response = await fetch(latestVersionUrl);
  if (response.status === 204) return '';
  const result = await response.json();
  if (response.status >= 400) {
    throw new Error(`${response.status}: Request to ${latestVersionUrl} failed:\n${JSON.stringify(result, null, 2)}`);
  }
  return (result.tag_name as string).slice(1).trim(); // strip of leading 'v' from tag to convert to semver string
};
