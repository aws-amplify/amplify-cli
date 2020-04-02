import path from 'path';
import * as execa from 'execa';
import fs from 'fs-extra';
import glob from 'glob';
import { shimSrcPath, shimBinaryName } from './constants';
import { BuildRequest, BuildResult } from 'amplify-function-plugin-interface';

export const buildResource = async (request: BuildRequest): Promise<BuildResult> => {
  const resourceDir = path.join(request.srcRoot);
  const projectPath = path.join(resourceDir);

  if (!request.lastBuildTimestamp || isBuildStale(request.srcRoot, request.lastBuildTimestamp)) {
    installDependencies(projectPath);

    return { rebuilt: true };
  }

  return { rebuilt: false };
};

const installDependencies = (resourceDir: string) => {
  runPackageManager(resourceDir, 'build');

  //to build invocation jar file
  //copy the jar file to lib folder for gradle build
  const jarPathDir = path.join(shimSrcPath, 'lib');

  fs.ensureDirSync(jarPathDir);
  fs.copySync(path.join(resourceDir, 'build', 'libs', shimBinaryName), path.join(jarPathDir, shimBinaryName));

  runPackageManager(shimSrcPath, 'fatJar');
};

const runPackageManager = (cwd: string, buildArgs: string) => {
  const packageManager = 'gradle';
  const args = [buildArgs];

  const result = execa.sync(packageManager, args, {
    cwd,
  });

  if (result.exitCode !== 0) {
    throw new Error(`${packageManager} failed, exit code was ${result.exitCode}`);
  }
};

const isBuildStale = (resourceDir: string, lastBuildTimestamp: Date) => {
  const dirTime = new Date(fs.statSync(resourceDir).mtime);

  if (dirTime > lastBuildTimestamp) {
    return true;
  }

  const fileUpdatedAfterLastBuild = glob
    .sync(`${resourceDir}/*/!(build | dist)/**`)
    .find(file => new Date(fs.statSync(file).mtime) > lastBuildTimestamp);

  return !!fileUpdatedAfterLastBuild;
};
