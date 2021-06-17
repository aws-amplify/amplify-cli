import { getPackageManager } from 'amplify-cli-core';
import { BuildRequest, BuildResult } from 'amplify-function-plugin-interface';
import execa from 'execa';
import * as fs from 'fs-extra';
import glob from 'glob';
import * as path from 'path';

// copied from the existing build-resources.js file in amplify-cli with changes for new interface
export async function buildResource(request: BuildRequest): Promise<BuildResult> {
  const resourceDir = request.service ? request.srcRoot : path.join(request.srcRoot, 'src');

  if (!request.lastBuildTimeStamp || isBuildStale(request.srcRoot, request.lastBuildTimeStamp)) {
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
  const packageManager = getPackageManager(cwd);

  if (packageManager === null) {
    // If no package manager was detected, it means that this functions or layer has no package.json, so no package operations
    // should be done.
    return;
  }

  const useYarn = packageManager.packageManager === 'yarn';
  const args = toPackageManagerArgs(useYarn, scriptName);
  try {
    execa.sync(packageManager.executable, args, {
      cwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      throw new Error(`Packaging lambda function failed. Could not find ${packageManager} executable in the PATH.`);
    } else {
      throw new Error(`Packaging lambda function failed with the error \n${error.message}`);
    }
  }
}

function toPackageManagerArgs(useYarn: boolean, scriptName?: string) {
  if (scriptName) {
    return useYarn ? [scriptName] : ['run-script', scriptName];
  }
  return useYarn ? [] : ['install'];
}

function isBuildStale(resourceDir: string, lastBuildTimeStamp: Date) {
  const dirTime = new Date(fs.statSync(resourceDir).mtime);
  if (dirTime > lastBuildTimeStamp) {
    return true;
  }
  const fileUpdatedAfterLastBuild = glob
    .sync(`${resourceDir}/**`)
    .filter(p => !p.includes('dist'))
    .filter(p => !p.includes('node_modules'))
    .find(file => new Date(fs.statSync(file).mtime) > lastBuildTimeStamp);
  return !!fileUpdatedAfterLastBuild;
}
