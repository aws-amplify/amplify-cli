import fs from 'fs-extra';
import { BuildRequest, BuildResult } from 'amplify-function-plugin-interface';
import glob from 'glob';
import execa from 'execa';

export async function pythonBuild(params: BuildRequest): Promise<BuildResult> {
  if (!params.lastBuildTimeStamp || isBuildStale(params.srcRoot, params.lastBuildTimeStamp)) {
    await execa.command('pipenv install', { cwd: params.srcRoot, stdio: 'inherit' }); // making virtual env in project folder
    return { rebuilt: true };
  }
  return { rebuilt: false };
}

function isBuildStale(resourceDir: string, lastBuildTimeStamp: Date) {
  const dirTime = new Date(fs.statSync(resourceDir).mtime);
  if (dirTime > lastBuildTimeStamp) {
    return true;
  }
  const fileUpdatedAfterLastBuild = glob
    .sync(`${resourceDir}/**`, { ignore: ['**/dist/**', '**/__pycache__/**'] })
    .find(file => new Date(fs.statSync(file).mtime) > lastBuildTimeStamp);
  return !!fileUpdatedAfterLastBuild;
}
