import * as execa from 'execa';
import { InvocationRequest } from 'amplify-function-plugin-interface';
import { shimBinPath } from './constants';
import { buildResource } from './build';

export const invokeResource = async (request: InvocationRequest, context: any) => {
  await buildResource({
    env: request.env,
    runtime: request.runtime,
    srcRoot: request.srcRoot,
    lastBuildTimestamp: request.lastBuildTimestamp,
  });

  const result = execa.sync('java', ['-jar', 'localinvoke-all.jar', request.handler, request.event], {
    cwd: shimBinPath,
  });

  if (result.exitCode !== 0) {
    throw new Error(`java failed, exit code was ${result.exitCode}`);
  }

  return result.stdout;
};
