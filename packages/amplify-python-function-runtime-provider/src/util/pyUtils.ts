import path from 'path';
import fs from 'fs-extra';
import * as which from 'which';
import { parse } from 'ini';
import { AmplifyError, execWithOutputAsString } from '@aws-amplify/amplify-cli-core';
import { getVirtualEnvPath } from './packageManagerUtils';

// Gets the virtual env dir where this function's dependencies are located
// This function now supports both uv and pipenv
export async function getPipenvDir(srcRoot: string): Promise<string> {
  return getVirtualEnvPath(srcRoot);
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
