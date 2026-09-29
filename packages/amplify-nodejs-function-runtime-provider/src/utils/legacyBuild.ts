import { execWithOutputAsString } from '@aws-amplify/amplify-cli-core';
import { $TSObject, getPackageManager, JSONUtilities, AmplifyError, PackageManager } from '@aws-amplify/amplify-cli-core';
import { BuildRequest, BuildResult, BuildType } from '@aws-amplify/amplify-function-plugin-interface';
import execa from 'execa';
import * as fs from 'fs-extra';
import { globSync } from 'glob';
import * as path from 'path';

/**
 * copied from the former build-resources.js file in amplify-cli with changes for new interface
 */
export const buildResource = async (request: BuildRequest): Promise<BuildResult> => {
  const resourceDir = request.service ? request.srcRoot : path.join(request.srcRoot, 'src');

  if (!request.lastBuildTimeStamp || isBuildStale(request.srcRoot, request.lastBuildTimeStamp, request.buildType, request.lastBuildType)) {
    if (request.scripts?.build) {
      await execWithOutputAsString(request.scripts.build, { cwd: resourceDir });
    } else {
      await installDependencies(resourceDir, request.buildType);
    }

    if (request.legacyBuildHookParams) {
      await runBuildScriptHook(request.legacyBuildHookParams.resourceName, request.legacyBuildHookParams.projectRoot);
    }
    return { rebuilt: true };
  }
  return { rebuilt: false };
};

const runBuildScriptHook = async (resourceName: string, projectRoot: string): Promise<void> => {
  const scriptName = `amplify:${resourceName}`;
  if (scriptExists(projectRoot, scriptName)) {
    await runPackageManagerScript(projectRoot, scriptName);
  }
};

const scriptExists = (projectRoot: string, scriptName: string): boolean => {
  const packageJsonPath = path.normalize(path.join(projectRoot, 'package.json'));
  const rootPackageJsonContents = JSONUtilities.readJson<$TSObject>(packageJsonPath, { throwIfNotExist: false });

  return !!rootPackageJsonContents?.scripts?.[scriptName];
};

const installDependencies = async (resourceDir: string, buildType: BuildType): Promise<void> => {
  await runPackageManagerInstall(resourceDir, buildType);
};

const runPackageManagerInstall = async (resourceDir: string, buildType: BuildType): Promise<void> => {
  const packageManager = await getPackageManager(resourceDir);
  if (packageManager === null) {
    // If no package manager was detected, it means that this functions or layer has no package.json, so no package operations
    // should be done.
    return;
  }

  const args = packageManager.getInstallArgs(buildType, resourceDir);
  await runPackageManager(packageManager, args, resourceDir);
};

const runPackageManagerScript = async (resourceDir: string, scriptName: string): Promise<void> => {
  const packageManager = await getPackageManager(resourceDir);
  if (packageManager === null) {
    // If no package manager was detected, it means that this functions or layer has no package.json, so no package operations
    // should be done.
    return;
  }

  const args = packageManager.getRunScriptArgs(scriptName);
  await runPackageManager(packageManager, args, resourceDir);
};

const runPackageManager = async (packageManager: PackageManager, args: string[], resourceDir: string): Promise<void> => {
  try {
    execa.sync(packageManager.executable, args, {
      cwd: resourceDir,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new AmplifyError(
        'PackagingLambdaFunctionError',
        {
          message: `Packaging lambda function failed. Could not find ${packageManager.packageManager} executable in the PATH.`,
        },
        error,
      );
    } else {
      throw new AmplifyError(
        'PackagingLambdaFunctionError',
        {
          message: `Packaging lambda function failed with the error \n${error.message}`,
        },
        error,
      );
    }
  }
};

const isBuildStale = (resourceDir: string, lastBuildTimeStamp: Date, buildType: BuildType, lastBuildType?: BuildType): boolean => {
  const dirTime = new Date(fs.statSync(resourceDir).mtime);
  // If the last build type not matching we have to flag a stale build to force
  // a npm/yarn install. This way devDependencies will not be packaged when we
  // push to the cloud.
  if (dirTime > lastBuildTimeStamp || buildType !== lastBuildType) {
    return true;
  }
  const fileUpdatedAfterLastBuild = globSync(`${resourceDir}/**`)
    .filter((p) => !p.includes('dist'))
    .filter((p) => !p.includes('node_modules'))
    .find((file) => new Date(fs.statSync(file).mtime) > lastBuildTimeStamp);
  return !!fileUpdatedAfterLastBuild;
};
