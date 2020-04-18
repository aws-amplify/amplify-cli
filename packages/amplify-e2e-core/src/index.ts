import path from 'path';
import * as fs from 'fs-extra';
import { spawnSync, execSync } from 'child_process';

export * from './utils/nexpect';
export * from './utils/retrier';

export * from './utils/';
export * from './configure/';
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
  return path.join(__dirname, '..', '..', 'amplify-cli', 'bin', 'amplify');
}

export function isCI(): boolean {
  return process.env.CI && process.env.CIRCLECI ? true : false;
}

export function npmInstall(cwd: string) {
  spawnSync('npm', ['install'], { cwd });
}

export async function installAmplifyCLI(version: string = 'latest') {
  return new Promise((resolve, reject) => {
    const amplifyCLIInstall = spawn('npm', ['install', '-g', `@aws-amplify/cli@${version}`], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    });

    amplifyCLIInstall.on('exit', code => {
      if (code === 0) {
        console.log(`Successfully installed Amplify CLI.`);
        resolve();
      } else {
        console.log(`Failed to install Amplify CLI. Please ensure a valid version was passed`);
        reject();
      }
    });
  });
}

export async function createNewProjectDir(projectName: string, prefix = path.join('/tmp', 'amplify-e2e-tests')): Promise<string> {
  const currentHash = execSync('git rev-parse --short HEAD', { cwd: __dirname })
    .toString()
    .trim();
  let projectDir;
  do {
    const randomId = await global.getRandomId();
    projectDir = path.join(prefix, `${projectName}_${currentHash}_${randomId}`);
  } while (fs.existsSync(projectDir));

  fs.ensureDirSync(projectDir);
  return projectDir;
}
