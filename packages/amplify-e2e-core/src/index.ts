import path from 'path';
import { spawnSync } from 'child_process';

export * from './utils/nexpect';

export function getCLIPath() {
  if (isCI()) {
    return 'amplify';
  }
  return path.join(__dirname, '..', '..', 'amplify-cli', 'bin', 'amplify');
}

export function isCI(): boolean {
  return process.env.CI ? true : false;
}

export function npmInstall(cwd: string) {
  spawnSync('npm', ['install'], { cwd });
}
