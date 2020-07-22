import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';
import childProcess from 'child_process';
import { BuildRequest, BuildResult } from 'amplify-function-plugin-interface';

// copied from the existing build-resources.js file in amplify-cli with changes for new interface
export async function buildResource(request: BuildRequest): Promise<BuildResult> {
  const resourceDir = path.join(request.srcRoot, 'src');

  if (!request.lastBuildTimestamp || isBuildStale(request.srcRoot, request.lastBuildTimestamp)) {
    installDependencies(resourceDir);
    if (request.legacyBuildHookParams) {
      runBuildScriptHook(request.legacyBuildHookParams.resourceName, request.legacyBuildHookParams.projectRoot);
    }
    return Promise.resolve({ rebuilt: true });
  }
  return Promise.resolve({ rebuilt: false });
}

function runBuildScriptHook(resourceName: string, projectRoot: string) {
  const scriptName = `amplify:${resourceName}`;
  if (scriptExists(projectRoot, scriptName)) {
    runPackageManager(projectRoot, scriptName);
  }
}

function scriptExists(projectRoot: string, scriptName: string) {
  const packageJsonPath = path.normalize(path.join(projectRoot, 'package.json'));
  if (fs.existsSync(packageJsonPath)) {
    const rootPackageJsonContents = require(packageJsonPath);
    return rootPackageJsonContents.scripts && rootPackageJsonContents.scripts[scriptName];
  }
  return false;
}

function installDependencies(resourceDir: string) {
  runPackageManager(resourceDir);
}

function runPackageManager(cwd: string, scriptName?: string) {
  const isWindows = /^win/.test(process.platform);
  const npm = isWindows ? 'npm.cmd' : 'npm';
  const yarn = isWindows ? 'yarn.cmd' : 'yarn';
  const useYarn = fs.existsSync(`${cwd}/yarn.lock`);
  const packageManager = useYarn ? yarn : npm;
  const args = toPackageManagerArgs(useYarn, scriptName);
  const childProcessResult = childProcess.spawnSync(packageManager, args, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (childProcessResult.status !== 0) {
    throw new Error(childProcessResult.output.join());
  }
}

function toPackageManagerArgs(useYarn: boolean, scriptName?: string) {
  if (scriptName) {
    return useYarn ? [scriptName] : ['run-script', scriptName];
  }
  return useYarn ? [] : ['install'];
}

function isBuildStale(resourceDir: string, lastBuildTimestamp: Date) {
  const dirTime = new Date(fs.statSync(resourceDir).mtime);
  if (dirTime > lastBuildTimestamp) {
    return true;
  }
  const fileUpdatedAfterLastBuild = glob
    .sync(`${resourceDir}/**`)
    .filter(p => !p.includes('dist'))
    .filter(p => !p.includes('node_modules'))
    .find(file => new Date(fs.statSync(file).mtime) > lastBuildTimestamp);
  return !!fileUpdatedAfterLastBuild;
}
