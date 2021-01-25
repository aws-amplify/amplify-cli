import fs from 'fs-extra';
import { BuildRequest, BuildResult } from 'amplify-function-plugin-interface/src';
import { execAsStringPromise } from './pyUtils';
import glob from 'glob';

export async function pythonBuild(params: BuildRequest): Promise<BuildResult> {
  if (!params.lastBuildTimeStamp || isBuildStale(params.srcRoot, params.lastBuildTimeStamp)) {
    const pipenvLogs = await execAsStringPromise('pipenv install', { cwd: params.srcRoot });
    console.log(pipenvLogs);
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
