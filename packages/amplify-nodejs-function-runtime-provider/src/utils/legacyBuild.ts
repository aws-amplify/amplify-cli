import { $TSObject, getPackageManager, JSONUtilities, AmplifyError } from '@aws-amplify/amplify-cli-core';
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
    installDependencies(resourceDir, request.buildType);
    if (request.legacyBuildHookParams) {
      runBuildScriptHook(request.legacyBuildHookParams.resourceName, request.legacyBuildHookParams.projectRoot);
    }
    return Promise.resolve({ rebuilt: true });
  }
  return Promise.resolve({ rebuilt: false });
};

const runBuildScriptHook = (resourceName: string, projectRoot: string): void => {
  const scriptName = `amplify:${resourceName}`;
  if (scriptExists(projectRoot, scriptName)) {
    runPackageManager(projectRoot, undefined, scriptName);
  }
};

const scriptExists = (projectRoot: string, scriptName: string): boolean => {
  const packageJsonPath = path.normalize(path.join(projectRoot, 'package.json'));
  const rootPackageJsonContents = JSONUtilities.readJson<$TSObject>(packageJsonPath, { throwIfNotExist: false });

  return !!rootPackageJsonContents?.scripts?.[scriptName];
};

const installDependencies = (resourceDir: string, buildType: BuildType): void => {
  runPackageManager(resourceDir, buildType);
};

const runPackageManager = (cwd: string, buildType?: BuildType, scriptName?: string): void => {
  const packageManager = getPackageManager(cwd);

  if (packageManager === null) {
    // If no package manager was detected, it means that this functions or layer has no package.json, so no package operations
    // should be done.
    return;
  }

  const useYarn = packageManager.packageManager === 'yarn';
  const args = toPackageManagerArgs(useYarn, buildType, scriptName);
  try {
    execa.sync(packageManager.executable, args, {
      cwd,
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
    } else if (error.stdout?.includes('YN0050: The --production option is deprecated')) {
      throw new AmplifyError(
        'PackagingLambdaFunctionError',
        {
          message: 'Packaging lambda function failed. Yarn 2 is not supported. Use Yarn 1.x and push again.',
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

const toPackageManagerArgs = (useYarn: boolean, buildType?: BuildType, scriptName?: string): string[] => {
  if (scriptName) {
    return useYarn ? [scriptName] : ['run-script', scriptName];
  }

  const args = useYarn ? ['--no-bin-links'] : ['install', '--no-bin-links'];

  if (buildType === BuildType.PROD) {
    args.push('--production');
  }

  return args;
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
