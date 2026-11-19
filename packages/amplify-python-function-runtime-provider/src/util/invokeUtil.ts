// responsible for interacting with the python shim that invokes the customer lambda function
import { InvocationRequest } from '@aws-amplify/amplify-function-plugin-interface';
import execa from 'execa';
import path from 'path';
import fs from 'fs-extra';
import { pathManager, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { packageName, relativeShimPath } from '../constants';
import { getPythonBinaryName } from './pyUtils';
import { detectPackageManager, getRunPrefix } from './packageManagerUtils';

const shimPath = path.join(pathManager.getAmplifyPackageLibDirPath(packageName), relativeShimPath);

export async function pythonInvoke(context: any, request: InvocationRequest): Promise<any> {
  const handlerParts = path.parse(request.handler);

  // Check if 'src' folder exists, otherwise use srcRoot directly
  const srcDir = path.join(request.srcRoot, 'src');
  const baseDir = fs.existsSync(srcDir) ? srcDir : request.srcRoot;
  const handlerFile = path.join(baseDir, handlerParts.dir, handlerParts.name);
  const handlerName = handlerParts.ext.replace('.', '');

  const pyBinary = getPythonBinaryName();

  if (!pyBinary) {
    throw new AmplifyError('LambdaFunctionInvokeError', { message: `Could not find 'python3' or 'python' executable in the PATH.` });
  }

  // Detect which package manager is in use
  const packageManager = await detectPackageManager();
  const runPrefix = getRunPrefix(packageManager);

  const childProcess = execa(runPrefix[0], [...runPrefix.slice(1), pyBinary, shimPath, handlerFile + '.py', handlerName], {
    cwd: request.srcRoot,
    env: { PATH: process.env.PATH, ...request.envVars }, // package manager relies on python in the PATH
    extendEnv: false,
    input: JSON.stringify({ event: request.event, context: {} }) + '\n',
  });

  childProcess.stderr?.pipe(process.stderr);
  childProcess.stdout?.pipe(process.stdout);

  let stdout;
  try {
    stdout = (await childProcess).stdout;
  } catch (err) {
    throw new AmplifyError('LambdaFunctionInvokeError', { message: err.message }, err);
  }

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
