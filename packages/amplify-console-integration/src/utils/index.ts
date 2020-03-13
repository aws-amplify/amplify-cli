import * as path from 'path';
import * as fs from 'fs-extra';
import * as rimraf from 'rimraf';
import { config } from 'dotenv';
export * from './projectMeta';
export * from './transformConfig';
export * from './awsExports';
export * from './sdk-calls';
export * from './api';
import { execSync } from 'child_process';

declare global {
  namespace NodeJS {
    interface Global {
      getRandomId: () => string;
    }
  }
}

// run dotenv config to update env variable
config();

export function getCLIPath() {
  if (isCI()) {
    return 'amplify';
  }
  return path.join(__dirname, '..', '..', '..', 'amplify-cli', 'bin', 'amplify');
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

export function deleteProjectDir(root: string) {
  return rimraf.sync(root);
}

export function isCI(): boolean {
  return process.env.CI ? true : false;
}

export function getEnvVars(): { ACCESS_KEY_ID: string; SECRET_ACCESS_KEY: string } {
  return { ...process.env } as { ACCESS_KEY_ID: string; SECRET_ACCESS_KEY: string };
}

export function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

export function overrideFunctionSrc(root: string, name: string, code: string) {
  let indexPath = path.join(root, `amplify/backend/function/${name}/src/index.js`);
  fs.writeFileSync(indexPath, code);
}

export function getFunctionSrc(root: string, name: string): Buffer {
  let indexPath = path.join(root, `amplify/backend/function/${name}/src/index.js`);
  return fs.readFileSync(indexPath);
}

export function createAuthProject(root?: string): string {
  if (!root) {
    root = path.join(__dirname, '../../../..', `amplify-integ-${Math.round(Math.random() * 100)}-test-${Math.round(Math.random() * 1000)}`);
  }
  fs.mkdirSync(root);
  fs.copySync(path.join(__dirname, '../../projects-templates/create-react-app-auth-amplify'), root);
  return root;
}
