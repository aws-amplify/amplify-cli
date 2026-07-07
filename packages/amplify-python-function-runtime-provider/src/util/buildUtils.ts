import fs from 'fs-extra';
import { BuildRequest, BuildResult } from '@aws-amplify/amplify-function-plugin-interface';
import { globSync } from 'glob';
import execa from 'execa';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';

export async function pythonBuild(params: BuildRequest): Promise<BuildResult> {
  if (!params.lastBuildTimeStamp || isBuildStale(params.srcRoot, params.lastBuildTimeStamp)) {
    try {
      await execa.command('pipenv install', { cwd: params.srcRoot, stdio: 'inherit' }); // making virtual env in project folder
    } catch (err) {
      throw new AmplifyError(
        'PackagingLambdaFunctionError',
        { message: `Failed to install dependencies in ${params.srcRoot}: ${err}` },
        err,
      );
    }
    return { rebuilt: true };
  }
  return { rebuilt: false };
}

function isBuildStale(resourceDir: string, lastBuildTimeStamp: Date) {
  const dirTime = new Date(fs.statSync(resourceDir).mtime);
  if (dirTime > lastBuildTimeStamp) {
    return true;
  }
  const fileUpdatedAfterLastBuild = globSync(`${resourceDir}/**`, { ignore: ['**/dist/**', '**/__pycache__/**'] }).find(
    (file) => new Date(fs.statSync(file).mtime) > lastBuildTimeStamp,
  );
  return !!fileUpdatedAfterLastBuild;
}
