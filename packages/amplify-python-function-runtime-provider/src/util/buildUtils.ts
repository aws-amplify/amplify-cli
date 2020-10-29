import fs from 'fs-extra';
import { BuildRequest, BuildResult } from 'amplify-function-plugin-interface/src';
import { execAsStringPromise } from './pyUtils';
import glob from 'glob';

export async function pythonBuild(params: BuildRequest): Promise<BuildResult> {
  if (!params.lastBuildTimestamp || isBuildStale(params.srcRoot, params.lastBuildTimestamp)) {
    const pipenvLogs = await execAsStringPromise('pipenv install', { cwd: params.srcRoot });
    console.log(pipenvLogs);
    return Promise.resolve({ rebuilt: true });
  }
  return Promise.resolve({ rebuilt: false });
}

function isBuildStale(resourceDir: string, lastBuildTimestamp: Date) {
  const dirTime = new Date(fs.statSync(resourceDir).mtime);
  if (dirTime > lastBuildTimestamp) {
    return true;
  }
  const fileUpdatedAfterLastBuild = glob
    .sync(`${resourceDir}/**`, { ignore: ['**/dist/**', '**/__pycache__/**'] })
    .find(file => new Date(fs.statSync(file).mtime) > lastBuildTimestamp);
  return !!fileUpdatedAfterLastBuild;
}
