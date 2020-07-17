import { join } from 'path';
import * as fs from 'fs-extra';
import { spawnSync, execSync } from 'child_process';

export * from './configure/';
export * from './init/';
export * from './utils/';
export * from './categories';
export * from './utils/sdk-calls';

declare global {
  namespace NodeJS {
    interface Global {
      getRandomId: () => string;
    }
  }
}

export function getCLIPath(testingWithLatestCodebase = false) {
  if (isCI() && !testingWithLatestCodebase) {
    return 'amplify';
  }
  return join(__dirname, '..', '..', 'amplify-cli', 'bin', 'amplify');
}

export function isCI(): boolean {
  return process.env.CI && process.env.CIRCLECI ? true : false;
}

export function npmInstall(cwd: string) {
  spawnSync('npm', ['install'], { cwd });
}

export async function installAmplifyCLI(version: string = 'latest') {
  spawnSync('npm', ['install', '-g', `@aws-amplify/cli@${version}`], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
}

export async function createNewProjectDir(projectName: string, prefix = join('/tmp', 'amplify-e2e-tests')): Promise<string> {
  const currentHash = execSync('git rev-parse --short HEAD', { cwd: __dirname })
    .toString()
    .trim();
  let projectDir;
  do {
    const randomId = await global.getRandomId();
    projectDir = join(prefix, `${projectName}_${currentHash}_${randomId}`);
  } while (fs.existsSync(projectDir));

  fs.ensureDirSync(projectDir);
  return projectDir;
}
