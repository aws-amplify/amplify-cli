import path from 'path';
import fs from 'fs-extra';
import { promisify } from 'util';
import { exec, ExecOptions } from 'child_process';

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
// errorMessage is an optional error message to throw if the command fails
// outputOnStderr is a flag if the 'success' output of the command will be on stderr (for some ungodly reason, this is how python --version works)
export async function execAsStringPromise(
  command: string,
  opts?: ExecOptions,
  errorMessage?: string,
  outputOnStderr: boolean = false,
): Promise<string> {
  const { stdout, stderr } = await promisify(exec)(command, opts);
  if (outputOnStderr) {
    return stderr.toString('utf8').trim();
  }
  if (stderr) {
    throw new Error(errorMessage || `Received error [${stderr.toString('utf8').trim()}] running command [${command}]`);
  }
  return stdout.toString('utf8').trim();
}
