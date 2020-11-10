import { $TSContext, isPackaged, pathManager } from 'amplify-cli-core';
import execa from 'execa';
import fetch from 'node-fetch';
import { gt } from 'semver';
import * as path from 'path';
import * as fs from 'fs-extra';
import ora from 'ora';

const binUrl = (version: string, platform: 'macos' | 'win.exe' | 'linux') =>
  `https://github.com/aws-amplify/amplify-cli/releases/download/v${version}/amplify-pkg-${platform}`;
const latestVersionUrl = 'https://api.github.com/repos/aws-amplify/amplify-cli/releases/latest';

export const run = async (context: $TSContext) => {
  const { version: thisVersion } = require('../../package.json');
  if (typeof thisVersion !== 'string') {
    throw new Error('Cannot determine current CLI version. Try manually re-installing the CLI.');
  }
  const latestVersion = await getLatestVersion();
  if (gt(latestVersion, thisVersion)) {
    await upgradeCli(latestVersion);
    context.print.success(`Successfully upgraded to Amplify CLI version ${latestVersion}!`);
  } else {
    context.print.info('This is the latest Amplify CLI version.');
  }
};

const upgradePackagedCli = async (version: string) => {
  const platform = process.platform === 'darwin' ? 'macos' : process.platform.startsWith('win') ? 'win.exe' : 'linux';
  const binName = process.platform.startsWith('win') ? 'amplify.exe' : 'amplify';
  const installLocation = path.join(pathManager.getHomeDotAmplifyDirPath(), 'bin', binName);
  const url = binUrl(version, platform);
  const spinner = ora();
  spinner.start('Downloading latest Amplify CLI version...');
  const response = await fetch(url);
  if (response.status >= 400) {
    throw new Error(`${response.status}: Request to ${url} failed:\n${JSON.stringify(response.json(), null, 2)}`);
  }
  const bin = await response.buffer();
  spinner.succeed('Download complete!');
  await fs.writeFile(installLocation, bin);
  await fs.chmod(installLocation, '700');
};

const upgradeNodeCli = async () => {
  await execa.command('npm i -g @aws-amplify/cli', { stdio: 'inherit' });
};

const getLatestNodeVersion = async (): Promise<string> => {
  const { stdout: version } = await execa.command('npm show @aws-amplify/cli version');
  return version.trim();
};

const getLatestPackagedVersion = async (): Promise<string> => {
  const response = await fetch(latestVersionUrl);
  if (response.status === 204) return '';
  const result = await response.json();
  if (response.status >= 400) {
    throw new Error(`${response.status}: Request to ${latestVersionUrl} failed:\n${JSON.stringify(result, null, 2)}`);
  }
  return (result.tag_name as string).slice(1).trim(); // strip of leading 'v' from tag to convert to semver string
};

const getLatestVersion = isPackaged ? getLatestPackagedVersion : getLatestNodeVersion;
const upgradeCli = isPackaged ? upgradePackagedCli : upgradeNodeCli;
