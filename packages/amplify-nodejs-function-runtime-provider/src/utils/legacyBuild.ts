import { $TSObject, getPackageManager, JSONUtilities, AmplifyError, PackageManager } from '@aws-amplify/amplify-cli-core';
import { BuildRequest, BuildResult, BuildType } from '@aws-amplify/amplify-function-plugin-interface';
import execa from 'execa';
import * as fs from 'fs-extra';
import glob from 'glob';
import * as path from 'path';

/**
 * copied from the former build-resources.js file in amplify-cli with changes for new interface
 */
export const buildResource = async (request: BuildRequest): Promise<BuildResult> => {
  const resourceDir = request.service ? request.srcRoot : path.join(request.srcRoot, 'src');

  if (!request.lastBuildTimeStamp || isBuildStale(request.srcRoot, request.lastBuildTimeStamp, request.buildType, request.lastBuildType)) {
    await installDependencies(resourceDir, request.buildType);
    if (request.legacyBuildHookParams) {
      await runBuildScriptHook(request.legacyBuildHookParams.resourceName, request.legacyBuildHookParams.projectRoot);
    }
    return Promise.resolve({ rebuilt: true });
  }
  return Promise.resolve({ rebuilt: false });
};

const runBuildScriptHook = async (resourceName: string, projectRoot: string): Promise<void> => {
  const scriptName = `amplify:${resourceName}`;
  if (scriptExists(projectRoot, scriptName)) {
    await runPackageManager(projectRoot, undefined, scriptName);
  }
};

const scriptExists = (projectRoot: string, scriptName: string): boolean => {
  const packageJsonPath = path.normalize(path.join(projectRoot, 'package.json'));
  const rootPackageJsonContents = JSONUtilities.readJson<$TSObject>(packageJsonPath, { throwIfNotExist: false });

  return !!rootPackageJsonContents?.scripts?.[scriptName];
};

const installDependencies = async (resourceDir: string, buildType: BuildType): Promise<void> => {
  await runPackageManager(resourceDir, buildType);
};

const runPackageManager = async (resourceDir: string, buildType?: BuildType, scriptName?: string): Promise<void> => {
  const packageManager = await getPackageManager(resourceDir);

  if (packageManager === null) {
    // If no package manager was detected, it means that this functions or layer has no package.json, so no package operations
    // should be done.
    return;
  }

  const args = await toPackageManagerArgs(packageManager, buildType, scriptName);
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

const toPackageManagerArgs = async (packageManager: PackageManager, buildType?: BuildType, scriptName?: string): Promise<string[]> => {
  switch (packageManager.packageManager) {
    case 'yarn': {
      const useYarnModern = packageManager.version?.major && packageManager.version?.major > 1;
      if (scriptName) {
        return [scriptName];
      }

      const args = useYarnModern ? [] : ['--no-bin-links'];

      if (buildType === BuildType.PROD) {
        args.push(useYarnModern ? 'build' : '--production');
      }

      return args;
    }
    case 'npm': {
      if (scriptName) {
        return ['run-script', scriptName];
      }

      const args = ['install', '--no-bin-links'];

      if (buildType === BuildType.PROD) {
        args.push('--production');
      }

      return args;
    }
    default: {
      throw new AmplifyError('PackagingLambdaFunctionError', {
        message: `Packaging lambda function failed. Unsupported package manager ${packageManager.packageManager}`,
      });
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
  const fileUpdatedAfterLastBuild = glob
    .sync(`${resourceDir}/**`)
    .filter((p) => !p.includes('dist'))
    .filter((p) => !p.includes('node_modules'))
    .find((file) => new Date(fs.statSync(file).mtime) > lastBuildTimeStamp);
  return !!fileUpdatedAfterLastBuild;
};
