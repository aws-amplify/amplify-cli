import path from 'path';
import fs from 'fs-extra';
import * as which from 'which';
import { parse } from 'ini';
import { AmplifyError, execWithOutputAsString } from '@aws-amplify/amplify-cli-core';

// Gets the pipenv dir where this function's dependencies are located
export async function getPipenvDir(srcRoot: string): Promise<string> {
  const pipEnvDir = await execWithOutputAsString('pipenv --venv', { cwd: srcRoot });
  const pyBinary = getPythonBinaryName();

  if (!pyBinary) {
    throw new AmplifyError('PackagingLambdaFunctionError', { message: `Could not find 'python3' or 'python' executable in the PATH.` });
  }

  let pipEnvPath = path.join(pipEnvDir, 'lib', `python${getPipfilePyVersion(path.join(srcRoot, 'Pipfile'))}`, 'site-packages');
  if (process.platform.startsWith('win')) {
    pipEnvPath = path.join(pipEnvDir, 'Lib', 'site-packages');
  }
  if (fs.existsSync(pipEnvPath)) {
    return pipEnvPath;
  }
  throw new AmplifyError('PackagingLambdaFunctionError', { message: `Could not find a pipenv site-packages directory at ${pipEnvPath}` });
}

export function majMinPyVersion(pyVersion: string): string {
  if (!/^Python \d+\.\d+\.\d+$/.test(pyVersion)) {
    throw new AmplifyError('PackagingLambdaFunctionError', { message: `Cannot interpret Python version "${pyVersion}"` });
  }
  const versionNum = pyVersion.split(' ')[1];
  return versionNum.split('.').slice(0, 2).join('.');
}

export const getPythonBinaryName = (): string | undefined => {
  const executables = ['python3', 'python'];
  let executablePath: string | null;

  for (const executable of executables) {
    executablePath = which.sync(executable, {
      nothrow: true,
    });

    if (executablePath !== null) {
      return executable;
    }
  }
  return undefined;
};

const getPipfilePyVersion = (pipfilePath: string) => {
  const pipfile = parse(fs.readFileSync(pipfilePath, 'utf-8'));
  const version = pipfile?.requires?.python_version;
  if (!version) {
    throw new AmplifyError('PackagingLambdaFunctionError', { message: `Did not find Python version specified in ${pipfilePath}` });
  }
  return version as string;
};
