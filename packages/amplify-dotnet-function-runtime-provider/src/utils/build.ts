import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';
import childProcess from 'child_process';
import { BuildRequest, BuildResult } from 'amplify-function-plugin-interface';

export async function build(request: BuildRequest): Promise<BuildResult> {
  const distPath = path.join(request.srcRoot, 'dist');
  return new Promise<BuildResult>((resolve, reject) => {
    const sourceFolder = path.join(request.srcRoot, 'src');
    if (!request.lastBuildTimestamp || !fs.existsSync(distPath) || isBuildStale(sourceFolder, request.lastBuildTimestamp)) {
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath);
      }
      const buildCommand = childProcess.spawn('dotnet', ['publish', '-c', 'Release', '-o', distPath], { cwd: sourceFolder });
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

function isBuildStale(sourceFolder: string, lastBuildTimestamp: Date) {
  const dirTime = new Date(fs.statSync(sourceFolder).mtime);
  if (dirTime > lastBuildTimestamp) {
    return true;
  }
  const fileUpdatedAfterLastBuild = glob
    .sync('**/*', { cwd: sourceFolder, ignore: ['bin', 'obj', '+(bin|obj)/**/*'] })
    .find(file => new Date(fs.statSync(path.join(sourceFolder, file)).mtime) > lastBuildTimestamp);
  return !!fileUpdatedAfterLastBuild;
}
