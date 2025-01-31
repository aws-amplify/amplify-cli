/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-cycle */
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as ini from 'ini';

import { spawnSync } from 'child_process';
import { v4 as uuid } from 'uuid';
import { pathManager } from '@aws-amplify/amplify-cli-core';
import { gt } from 'semver';
import { sleep } from '.';

export * from './diagnose';
export * from './configure';
export * from './init';
export * from './utils';
export * from './categories';
export * from './export';
export { addFeatureFlag, loadFeatureFlags } from './utils/feature-flags';
export * from './cli-version-controller';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      getRandomId: () => string;
    }
  }
}

const amplifyTestsDir = 'amplify-e2e-tests';

export function getCLIPath(testingWithLatestCodebase = false) {
  if (!testingWithLatestCodebase) {
    if (process.env.AMPLIFY_PATH && fs.existsSync(process.env.AMPLIFY_PATH)) {
      return process.env.AMPLIFY_PATH;
    }
    return process.platform === 'win32' ? 'amplify.exe' : 'amplify';
  }

  const amplifyScriptPath = path.join(__dirname, '..', '..', 'amplify-cli', 'bin', 'amplify');
  return amplifyScriptPath;
}

export function isTestingWithLatestCodebase(scriptRunnerPath) {
  return scriptRunnerPath === process.execPath;
}

export function getScriptRunnerPath(testingWithLatestCodebase = false) {
  if (!testingWithLatestCodebase) {
    return process.platform === 'win32' ? 'node.exe' : 'exec';
  }

  // nodejs executable
  return process.execPath;
}

export function getNpxPath() {
  let npxPath = 'npx';
  if (process.platform === 'win32') {
    npxPath = getScriptRunnerPath().replace('node.exe', 'npx.cmd');
  }
  return npxPath;
}

export function getNpmPath() {
  let npmPath = 'npm';
  if (process.platform === 'win32') {
    npmPath = getScriptRunnerPath().replace('node.exe', 'npm.cmd');
  }
  return npmPath;
}

export function injectSessionToken(profileName: string) {
  const credentialsContents = ini.parse(fs.readFileSync(pathManager.getAWSCredentialsFilePath()).toString());
  credentialsContents[profileName] = credentialsContents[profileName] || {};
  credentialsContents[profileName].aws_session_token = process.env.AWS_SESSION_TOKEN;
  fs.writeFileSync(pathManager.getAWSCredentialsFilePath(), ini.stringify(credentialsContents));
}

export function npmInstall(cwd: string) {
  spawnSync('npm', ['install'], { cwd });
}

export async function installAmplifyCLI(version = 'latest') {
  spawnSync('npm', ['install', '-g', `@aws-amplify/cli@${version}`], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });

  console.log('SETTING PATH:');
  if (gt(version, '10.0.0')) {
    process.env.AMPLIFY_PATH =
      process.platform === 'win32'
        ? path.join(os.homedir(), '.amplify', 'bin', 'amplify')
        : path.join(os.homedir(), '.amplify', 'bin', 'amplify');
  } else {
    process.env.AMPLIFY_PATH =
      process.platform === 'win32'
        ? path.join(os.homedir(), '..', '..', 'Program` Files', 'nodejs', 'node_modules', '@aws-amplify', 'cli', 'bin', 'amplify')
        : path.join(os.homedir(), '.npm-global', 'bin', 'amplify');
  }

  console.log('PATH SET:', process.env.AMPLIFY_PATH);
}

export async function createNewProjectDir(
  projectName: string,
  // eslint-disable-next-line spellcheck/spell-checker
  prefix = path.join(fs.realpathSync(os.tmpdir()), amplifyTestsDir),
): Promise<string> {
  let projectDir;
  do {
    projectDir = path.join(prefix, `${projectName}_${Math.floor(Math.random() * 1000000)}`);
  } while (fs.existsSync(projectDir));

  fs.ensureDirSync(projectDir);

  const initialDelay = Math.floor(Math.random() * 180 * 1000);
  await sleep(initialDelay);

  console.log(projectDir);
  return projectDir;
}

export const createTempDir = () => {
  // eslint-disable-next-line spellcheck/spell-checker
  const osTempDir = fs.realpathSync(os.tmpdir());
  const tempProjectDir = path.join(osTempDir, amplifyTestsDir, uuid());

  fs.mkdirsSync(tempProjectDir);

  return tempProjectDir;
};
