import { join } from 'path';
import * as execa from 'execa';
import fs from 'fs-extra';
import { globSync } from 'glob';
import { packageName, relativeShimJarPath, relativeShimSrcPath } from './constants';
import { BuildRequest, BuildResult } from '@aws-amplify/amplify-function-plugin-interface';
import { AmplifyError, pathManager } from '@aws-amplify/amplify-cli-core';

export const buildResource = async (request: BuildRequest): Promise<BuildResult> => {
  const resourceDir = join(request.srcRoot);
  const projectPath = join(resourceDir);

  if (!request.lastBuildTimeStamp || isBuildStale(request.srcRoot, request.lastBuildTimeStamp)) {
    installDependencies(projectPath);

    return { rebuilt: true };
  }

  return { rebuilt: false };
};

const installDependencies = (resourceDir: string) => {
  runPackageManager(resourceDir, 'build');

  // ensure invoker shim is built
  const packageLibDir = pathManager.getAmplifyPackageLibDirPath(packageName);
  if (!fs.existsSync(join(packageLibDir, relativeShimJarPath))) {
    runPackageManager(join(packageLibDir, relativeShimSrcPath), 'jar');
  }
};

const runPackageManager = (cwd: string, buildArgs: string) => {
  const packageManager = 'gradle';
  const args = [buildArgs];

  try {
    const result = execa.sync(packageManager, args, {
      cwd,
    });

    if (result.exitCode !== 0) {
      throw new AmplifyError('PackagingLambdaFunctionError', { message: `${packageManager} failed, exit code was ${result.exitCode}` });
    }
  } catch (err) {
    throw new AmplifyError('PackagingLambdaFunctionError', { message: `${packageManager} failed, error message was ${err.message}` }, err);
  }
};

const isBuildStale = (resourceDir: string, lastBuildTimeStamp: Date) => {
  const dirTime = new Date(fs.statSync(resourceDir).mtime);

  if (dirTime > lastBuildTimeStamp) {
    return true;
  }

  const fileUpdatedAfterLastBuild = globSync(`${resourceDir}/*/!(build | dist)/**`).find(
    (file) => new Date(fs.statSync(file).mtime) > lastBuildTimeStamp,
  );

  return !!fileUpdatedAfterLastBuild;
};
