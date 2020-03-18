import path from 'path';
import fs from 'fs-extra';
import childProcess from 'child_process';
import { BuildRequest, BuildResult } from 'amplify-function-plugin-interface';

// copied from the existing build-resources.js file in amplify-cli with changes for new interface
export async function buildResource(request: BuildRequest): Promise<BuildResult> {
  const resourceDir = path.join(request.srcRoot, 'src');

  if (!request.lastBuildTimestamp || isBuildStale(request.srcRoot, request.lastBuildTimestamp)) {
    installDependencies(resourceDir);
    runBuildScriptHook(request.legacyBuildHookParams.resourceName, request.legacyBuildHookParams.projectRoot);
    return Promise.resolve({rebuilt: true});
  }
  return Promise.resolve({rebuilt: false});
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

function isBuildStale(resourceDir: string, lastBuildTimestamp: any) {
  const lastBuildDate = new Date(lastBuildTimestamp);
  const sourceFiles = getSourceFiles(resourceDir, 'node_modules');
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