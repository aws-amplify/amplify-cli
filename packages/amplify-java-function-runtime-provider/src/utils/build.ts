import path from 'path';
import fs from 'fs-extra';
import childProcess from 'child_process';
import glob from 'glob';
import _ from 'lodash';
import {constants} from "./constants"
import { BuildRequest, BuildResult } from 'amplify-function-plugin-interface';

export async function buildResource(request: BuildRequest): Promise<BuildResult> {
  const resourceDir = path.join(request.srcRoot);
  const projectPath = path.join(resourceDir);
  if (!request.lastBuildTimestamp || isBuildStale(request.srcRoot, request.lastBuildTimestamp)) {
    installDependencies(projectPath);
    return Promise.resolve({ rebuilt: true });
  }
  return Promise.resolve({ rebuilt: false });
}

function installDependencies(resourceDir: string) {
  runPackageManager(resourceDir ,'build' );
  //to build invocation jar file
  //copy the jar file to lib folder for gradle build
  const jarPathDir = path.join(constants.shimSrcPath,'lib');
  fs.ensureDirSync(jarPathDir);
  fs.copySync(path.join(resourceDir, 'build','libs',constants.shimBinaryName), path.join(jarPathDir,constants.shimBinaryName));
  runPackageManager(constants.shimSrcPath,"fatJar");
}

function runPackageManager(cwd: string, buildArgs : string) {
  const packageManager = 'gradle';
  const args = [buildArgs];
  const childProcessResult = childProcess.spawnSync(packageManager, args, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (childProcessResult.status !== 0) {
    throw new Error(childProcessResult.output.join());
  }
}

function isBuildStale(resourceDir: string, lastBuildTimestamp: Date) {
  const dirTime = new Date(fs.statSync(resourceDir).mtime);
  if (dirTime > lastBuildTimestamp) {
    return true;
  }

  const fileUpdatedAfterLastBuild = glob
    .sync(`${resourceDir}/*/!(build | dist)/**`)
    .find(file => new Date(fs.statSync(file).mtime) > lastBuildTimestamp);
  return !!fileUpdatedAfterLastBuild;
}
