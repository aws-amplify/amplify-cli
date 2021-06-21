import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import { spawnSync, execSync } from 'child_process';
import { v4 as uuid } from 'uuid';

export * from './configure/';
export * from './init/';
export * from './utils/';
export * from './categories';
export * from './utils/sdk-calls';
export { addFeatureFlag } from './utils/feature-flags';

declare global {
  namespace NodeJS {
    interface Global {
      getRandomId: () => string;
    }
  }
}

const amplifyTestsDir = 'amplify-e2e-tests';

export function getCLIPath(testingWithLatestCodebase = false) {
  return testingWithLatestCodebase
    ? path.join(__dirname, '..', '..', 'amplify-cli', 'bin', 'amplify')
    : process.env.AMPLIFY_PATH || 'amplify';
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

export async function createNewProjectDir(
  projectName: string,
  prefix = path.join(fs.realpathSync(os.tmpdir()), amplifyTestsDir),
): Promise<string> {
  const currentHash = execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().trim();
  let projectDir;
  do {
    const randomId = await global.getRandomId();
    projectDir = path.join(prefix, `${projectName}_${currentHash}_${randomId}`);
  } while (fs.existsSync(projectDir));

  fs.ensureDirSync(projectDir);
  console.log(projectDir);
  return projectDir;
}

export const createTempDir = () => {
  const osTempDir = fs.realpathSync(os.tmpdir());
  const tempProjectDir = path.join(osTempDir, amplifyTestsDir, uuid());

  fs.mkdirsSync(tempProjectDir);

  return tempProjectDir;
};
