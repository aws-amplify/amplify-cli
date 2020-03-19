import path from 'path';
import fs from 'fs-extra';
import childProcess from 'child_process';
import { BuildRequest } from 'amplify-function-plugin-interface/src';

// copied from the existing build-resources.js file in amplify-cli with changes for new interface
export async function buildResource(request: BuildRequest): Promise<boolean> {
  const resourceDir = path.join(request.srcRoot, 'src');

  if (!request.lastBuildTimestamp || isBuildStale(request.srcRoot, request.lastBuildTimestamp) || isValidProject(resourceDir)) {
    installDependencies(resourceDir);
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
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

function isBuildStale(resourceDir: string, lastBuildTimestamp: any) {
  const lastBuildDate = new Date(lastBuildTimestamp);
  const sourceFiles = getSourceFiles(resourceDir);
  const dirMTime = fs.statSync(resourceDir).mtime;
  if (new Date(dirMTime) > lastBuildDate) {
    return true;
  }

  for (let i = 0; i < sourceFiles.length; i += 1) {
    const file = sourceFiles[i];
    const fileMTime = fs.statSync(file).mtime;
    if (new Date(fileMTime) > lastBuildDate) {
      return true;
    }
  }
  return false;
}

function getSourceFiles(dir: string, ignoredDir?: any): string[] {
  if (!fs.statSync(dir).isDirectory()) return [dir];
  return fs.readdirSync(dir).reduce((acc, f) => {
    if (f === ignoredDir) {
      return acc;
    }
    return acc.concat(getSourceFiles(path.join(dir, f)));
  }, new Array<string>());
}