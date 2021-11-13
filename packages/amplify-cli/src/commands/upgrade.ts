import { $TSContext, isPackaged, pathManager } from 'amplify-cli-core';
import fetch from 'node-fetch';
import { gt } from 'semver';
import * as path from 'path';
import * as fs from 'fs-extra';
import { oldVersionPath } from '../utils/win-constants';
import chalk from 'chalk';
import gunzip from 'gunzip-maybe';
import tar from 'tar-fs';
import ProgressBar from 'progress';
import { pipeline } from 'stream';
import { promisify } from 'util';

const repoOwner = 'aws-amplify';
const repoName = 'amplify-cli';

const binName = (platform: 'macos' | 'win.exe' | 'linux') => `amplify-pkg-${platform}`;
const binUrl = (version: string, binName: string) =>
  `https://github.com/${repoOwner}/${repoName}/releases/download/v${version}/${binName}.tgz`;
const latestVersionUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;

export const run = async (context: $TSContext) => {
  if (!isPackaged) {
    context.print.warning('"upgrade" is not supported in this installation of Amplify.');
    context.print.info(`Use ${chalk.blueBright('npm i -g @aws-amplify/cli')} instead.`);
    return;
  }
  const { version: thisVersion } = require('../../package.json');
  if (typeof thisVersion !== 'string') {
    throw new Error('Cannot determine current CLI version. Try uninstalling and reinstalling the CLI.');
  }
  const latestVersion = await getLatestVersion();
  if (gt(latestVersion, thisVersion)) {
    await upgradeCli(context.print, latestVersion);
    context.print.success(`Successfully upgraded to Amplify CLI version ${latestVersion}!`);
  } else {
    context.print.info('This is the latest Amplify CLI version.');
  }
};

const upgradeCli = async (print, version: string) => {
  const isWin = process.platform.startsWith('win');
  const binDir = path.join(pathManager.getHomeDotAmplifyDirPath(), 'bin');
  const binPath = path.join(binDir, isWin ? 'amplify.exe' : 'amplify');
  const platformSuffix = isWin ? 'win.exe' : process.platform === 'darwin' ? 'macos' : 'linux';
  const extractedName = binName(platformSuffix);
  const extractedPath = path.join(binDir, extractedName);
  const url = binUrl(version, extractedName);

  if (isWin) {
    await fs.move(binPath, oldVersionPath);
  }
  const response = await fetch(url);
  if (response.status >= 400) {
    throw new Error(`${response.status}: Request to ${url} failed:\n${JSON.stringify(response.json(), null, 2)}`);
  }
  const len = response.headers.get('content-length');
  if (!len) {
    throw new Error('No content length specified!');
  }
  const downloadLength = parseInt(len, 10);
  const progressBar = new ProgressBar(':percent [:bar] :eta seconds left', {
    complete: '=',
    incomplete: ' ',
    width: 40,
    total: downloadLength,
    renderThrottle: 100,
  });
  print.info('Downloading latest Amplify CLI');
  const downloadPromise = promisify(pipeline)(response.body, gunzip(), tar.extract(binDir));
  response.body.on('data', chunk => progressBar.tick(chunk.length));
  await downloadPromise;
  await fs.move(extractedPath, binPath, { overwrite: true });
  await fs.chmod(binPath, '700');
};

const getLatestVersion = async (): Promise<string> => {
  const response = await fetch(latestVersionUrl);
  if (response.status === 204) return '';
  const result = await response.json();
  if (response.status >= 400) {
    throw new Error(`${response.status}: Request to ${latestVersionUrl} failed:\n${JSON.stringify(result, null, 2)}`);
  }
  return (result.tag_name as string).slice(1).trim(); // strip off leading 'v' from tag to convert to semver string
};
