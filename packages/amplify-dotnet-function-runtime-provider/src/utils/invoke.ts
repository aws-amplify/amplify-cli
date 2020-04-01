import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';
import * as execa from 'execa';
import { InvocationRequest } from 'amplify-function-plugin-interface';
import { build } from './build';
import { shimSrcPath, shimExecutablePath, executableName, shimBinPath } from '../constants';

export const invoke = async (request: InvocationRequest): Promise<string> => {
  if (await isInvokerStale(shimSrcPath, shimExecutablePath)) {
    await buildInvoker();
  }

  await build({
    env: request.env,
    runtime: request.runtime,
    srcRoot: request.srcRoot,
    lastBuildTimestamp: request.lastBuildTimestamp,
  });

  const result = execa.sync(executableName, [shimExecutablePath, request.handler], {
    cwd: request.srcRoot,
    env: {
      ...process.env,
      ...request.envVars,
    },
    input: request.event,
  });

  if (result.exitCode !== 0) {
    throw new Error(`${executableName} ${shimExecutablePath} failed, exit code was ${result.exitCode}`);
  }

  return result.stdout;
};

const isInvokerStale = (shimSrcPath: string, shimBinPath: string) => {
  if (!fs.existsSync(shimBinPath)) {
    return true;
  }

  const lastBuildTime = new Date(fs.statSync(shimBinPath).mtime);
  const fileUpdatedAfterLastBuild = glob
    .sync('**/*', { cwd: shimSrcPath, ignore: ['bin', 'obj', '+(bin|obj)/**/*'] })
    .find(file => new Date(fs.statSync(path.join(shimSrcPath, file)).mtime) > lastBuildTime);

  return !!fileUpdatedAfterLastBuild;
};

const buildInvoker = async () => {
  const result = execa.sync(executableName, ['publish', '-c', 'Release', '-o', shimBinPath], {
    cwd: shimSrcPath,
  });

  if (result.exitCode !== 0) {
    throw new Error(`Shim build failed, exit code was ${result.exitCode}`);
  }
};
