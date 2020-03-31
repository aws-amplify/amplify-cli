import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';
import childProcess from 'child_process';
import { constants } from '../constants';
import { InvocationRequest } from 'amplify-function-plugin-interface';
import { build } from './build';

export async function invoke(request: InvocationRequest): Promise<string> {
  if (await isInvokerStale(constants.shimSrcPath, constants.shimExecutablePath)) {
    await buildInvoker();
  }
  await build({
    env: request.env,
    runtime: request.runtime,
    srcRoot: request.srcRoot,
    lastBuildTimestamp: request.lastBuildTimestamp,
  });

  const distPath = path.join(request.srcRoot, 'dist');
  return new Promise<string>((resolve, reject) => {
    const invokeCommand = childProcess.spawn('dotnet', [constants.shimExecutablePath, request.handler], {
      cwd: request.srcRoot,
      env: {
        ...process.env,
        ...request.envVars,
      },
      stdio: ['pipe', 'pipe', process.stderr],
    });

    invokeCommand.stdin.setDefaultEncoding('utf-8');
    invokeCommand.stdin.write(request.event);
    invokeCommand.stdin.end();

    const dataBuffer = Buffer.alloc(4096);
    invokeCommand.stdout.setEncoding('utf-8');
    invokeCommand.stdout.on('data', data => {
      dataBuffer.write(data);
    });

    invokeCommand.on('close', code => {
      if (code === 0) {
        return resolve(dataBuffer.toString());
      } else {
        return reject();
      }
    });
  });

  function isInvokerStale(shimSrcPath: string, shimBinPath: string) {
    if (!fs.existsSync(shimBinPath)) {
      return true;
    }
    const lastBuildTime = new Date(fs.statSync(shimBinPath).mtime);
    const fileUpdatedAfterLastBuild = glob
      .sync('**/*', { cwd: shimSrcPath, ignore: ['bin', 'obj', '+(bin|obj)/**/*'] })
      .find(file => new Date(fs.statSync(path.join(shimSrcPath, file)).mtime) > lastBuildTime);
    return !!fileUpdatedAfterLastBuild;
  }

  async function buildInvoker() {
    return new Promise((resolve, reject) => {
      const invokeCommand = childProcess.spawn('dotnet', ['publish', '-c', 'Release', '-o', constants.shimBinPath], {
        cwd: constants.shimSrcPath,
      });

      invokeCommand.stdin.setDefaultEncoding('utf-8');
      invokeCommand.stdin.write(request.event);
      invokeCommand.stdin.end();
      invokeCommand.on('close', code => {
        if (code === 0) {
          return resolve();
        } else {
          return reject();
        }
      });
    });
  }
}
