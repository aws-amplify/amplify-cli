import path from 'path';
import fs from 'fs-extra';
import childProcess from 'child_process';
import { BuildRequest, BuildResult } from 'amplify-function-plugin-interface';

// copied from the existing build-resources.js file in amplify-cli with changes for new interface
export async function buildResource(request: BuildRequest): Promise<BuildResult>{
  const resourceDir = path.join(request.srcRoot);

  if (!request.lastBuildTimestamp || isValidProject(resourceDir)) {
    installDependencies(resourceDir);
    return Promise.resolve({ rebuilt: true });  }
    return Promise.resolve({ rebuilt: false });
  }

function isValidProject(cwd : string){
  const packageManager = 'mvn';
  const args = ['validate'];
  const childProcessResult = childProcess.spawnSync(packageManager, args, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (childProcessResult.status !== 0) {
    throw new Error(childProcessResult.output.join());
  }
}

function installDependencies(resourceDir: string) {
  runPackageManager(resourceDir);
}

function runPackageManager(cwd: string) {
  const packageManager = 'mvn';
  const args = ['compile'];
  const childProcessResult = childProcess.spawnSync(packageManager, args, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (childProcessResult.status !== 0) {
    throw new Error(childProcessResult.output.join());
  }
}