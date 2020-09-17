// responsible for interacting with the python shim that invokes the customer labmda function

import { InvocationRequest } from 'amplify-function-plugin-interface/src';
import execa from 'execa';
import path from 'path';

const shimPath = path.join(__dirname, '../../shim/shim.py');

export async function pythonInvoke(context: any, request: InvocationRequest): Promise<any> {
  const handlerParts = path.parse(request.handler);
  const handlerFile = path.join(request.srcRoot, 'src', handlerParts.dir, handlerParts.name);
  const handlerName = handlerParts.ext.replace('.', '');
  const childProcess = execa('pipenv', ['run', 'python3', shimPath, handlerFile + '.py', handlerName]);
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
