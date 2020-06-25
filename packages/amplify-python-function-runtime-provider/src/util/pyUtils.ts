import path from 'path';
import fs from 'fs-extra';
import { ExecOptions } from 'child_process';
import execa from 'execa';

// Gets the pipenv dir where this function's dependencies are located
export async function getPipenvDir(srcRoot: string): Promise<string> {
  const pipEnvDir = await execAsStringPromise('pipenv --venv', { cwd: srcRoot });
  const pyVersion = await execAsStringPromise('python3 --version');
  let pipEnvPath = path.join(pipEnvDir, 'lib', 'python' + majMinPyVersion(pyVersion), 'site-packages');
  if (process.platform.startsWith('win')) {
    pipEnvPath = path.join(pipEnvDir, 'Lib', 'site-packages');
  }
  if (fs.existsSync(pipEnvPath)) {
    return pipEnvPath;
  }
  throw new Error(`Could not find a pipenv site-packages directory at ${pipEnvPath}`);
}

export function majMinPyVersion(pyVersion: string): string {
  if (!/^Python \d+\.\d+\.\d+$/.test(pyVersion)) {
    throw new Error(`Cannot interpret Python version "${pyVersion}"`);
  }
  const versionNum = pyVersion.split(' ')[1];
  return versionNum
    .split('.')
    .slice(0, 2)
    .join('.');
}

// wrapper for executing a shell command and returning the result as a string promise
// opts are passed directly to the exec command
export async function execAsStringPromise(command: string, opts?: ExecOptions): Promise<string> {
  try {
    return (await execa.command(command, opts)).stdout;
  } catch (err) {
    throw new Error(`Recieved error [${err}] running command [${command}]`);
  }
}
