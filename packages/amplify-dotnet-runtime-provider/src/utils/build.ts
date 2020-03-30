import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';
import childProcess from 'child_process';
import { BuildRequest, BuildResult } from 'amplify-function-plugin-interface';

export async function build(request: BuildRequest): Promise<BuildResult> {
  return new Promise<BuildResult>((resolve, reject) => {
    if (!request.legacyBuildHookParams) throw new Error('Missing resource information');
    const sourceDir = path.join(request.srcRoot, 'src', request.legacyBuildHookParams.resourceName);
    const distPath = path.join(request.srcRoot, 'dist');

    if (!request.lastBuildTimestamp || !fs.existsSync(distPath) || isBuildStale(sourceDir, request.lastBuildTimestamp)) {
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath);
      }
      const buildCommand = childProcess.spawn('dotnet', ['publish', '-o', distPath], { cwd: sourceDir });
      buildCommand.on('close', code => {
        if (code === 0) {
          return resolve({ rebuilt: true });
        } else {
          return resolve({ rebuilt: false });
        }
      });
    } else {
      return resolve({ rebuilt: false });
    }
  });
}

function isBuildStale(resourceDir: string, lastBuildTimestamp: Date) {
  const dirTime = new Date(fs.statSync(resourceDir).mtime);
  if (dirTime > lastBuildTimestamp) {
    return true;
  }
  const fileUpdatedAfterLastBuild = glob
    .sync(`${resourceDir}/*/!(bin|obj)/**`)
    .find(file => new Date(fs.statSync(file).mtime) > lastBuildTimestamp);
  return !!fileUpdatedAfterLastBuild;
}
