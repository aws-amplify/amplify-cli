// responsible for interacting with the python shim that invokes the customer labmda function

import { InvocationRequest } from 'amplify-function-plugin-interface/src';
import execa from 'execa';
import path from 'path';
import { pathManager } from 'amplify-cli-core';
import { packageName, relativeShimPath } from '../constants';
import { getPythonBinaryName } from './pyUtils';

const shimPath = path.join(pathManager.getAmplifyPackageLibDirPath(packageName), relativeShimPath);

export async function pythonInvoke(context: any, request: InvocationRequest): Promise<any> {
  const handlerParts = path.parse(request.handler);
  const handlerFile = path.join(request.srcRoot, 'src', handlerParts.dir, handlerParts.name);
  const handlerName = handlerParts.ext.replace('.', '');

  const pyBinary = getPythonBinaryName();

  if (!pyBinary) {
    throw new Error(`Could not find 'python3' or 'python' executable in the PATH.`);
  }

  const childProcess = execa('pipenv', ['run', pyBinary, shimPath, handlerFile + '.py', handlerName]);

  childProcess.stdout.pipe(process.stdout);
  childProcess.stdin.write(JSON.stringify({ event: request.event, context: {} }) + '\n');

  const { stdout } = await childProcess;
  const lines = stdout.split('\n');
  const lastLine = lines[lines.length - 1];

  let result = lastLine;

  try {
    result = JSON.parse(lastLine);
  } catch (err) {
    context.print.warning('Could not parse function output as JSON. Using raw output.');
  }

  return result;
}
