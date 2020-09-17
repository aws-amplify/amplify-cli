import execa from 'execa';
import path from 'path';
import { InvocationRequest } from 'amplify-function-plugin-interface';
import { shimJarPath } from './constants';
import { buildResource } from './build';

export const invokeResource = async (request: InvocationRequest, context: any) => {
  await buildResource({
    env: request.env,
    runtime: request.runtime,
    srcRoot: request.srcRoot,
    lastBuildTimestamp: request.lastBuildTimestamp,
  });

  const [handlerClassName, handlerMethodName] = request.handler.split('::');

  const childProcess = execa('java',
    ['-jar', shimJarPath, path.join(request.srcRoot, 'build', 'libs', 'latest_build.jar'), handlerClassName, handlerMethodName],
    {
      input: request.event,
    });
  childProcess.stdout.pipe(process.stdout);

  const { stdout, exitCode } = await childProcess;
  if (exitCode !== 0) {
    throw new Error(`java failed, exit code was ${exitCode}`);
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
};
