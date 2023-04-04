import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';
import * as execa from 'execa';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { BuildRequest, BuildResult, BuildType } from '@aws-amplify/amplify-function-plugin-interface';
import { printer } from '@aws-amplify/amplify-prompts';
import { dotnetcore31, executableName } from '../constants';

export const build = async ({ srcRoot, lastBuildTimeStamp, buildType, runtime }: BuildRequest): Promise<BuildResult> => {
  if (runtime === dotnetcore31) {
    printer.warn(`.NET Core 3.1 is deprecated. Migrate your function at ${srcRoot} to .NET 6.`);
  }
  const distPath = path.join(srcRoot, 'dist');
  const sourceFolder = path.join(srcRoot, 'src');
  if (!lastBuildTimeStamp || !fs.existsSync(distPath) || isBuildStale(sourceFolder, lastBuildTimeStamp)) {
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath);
    }

    const buildArguments = [];
    switch (buildType) {
      case BuildType.PROD:
        buildArguments.push('publish', '-c', 'Release', '-o', distPath);
        break;
      case BuildType.DEV:
        // Debug config, copy all required assemblies for mocking.
        // The CopyLocalLockFileAssemblies really shouldn't be necessary, but
        // we encountered CircleCI e2e test issues without it.
        buildArguments.push('build', '-c', 'Debug', '-p:CopyLocalLockFileAssemblies=true');
        break;
      default:
        throw new AmplifyError('PackagingLambdaFunctionError', { message: `Unexpected buildType: [${buildType}]` });
    }
    try {
      const result = execa.sync(executableName, buildArguments, {
        cwd: sourceFolder,
      });

      if (result.exitCode !== 0) {
        throw new AmplifyError('PackagingLambdaFunctionError', {
          message: `${executableName} build failed, exit code was ${result.exitCode}`,
        });
      }
    } catch (err) {
      throw new AmplifyError(
        'PackagingLambdaFunctionError',
        {
          message: `${executableName} build failed, error message was ${err.message}`,
        },
        err,
      );
    }

    return { rebuilt: true };
  }

  return { rebuilt: false };
};

const isBuildStale = (sourceFolder: string, lastBuildTimeStamp: Date) => {
  // Guard against invalid timestamp
  if (!(lastBuildTimeStamp instanceof Date && !isNaN(<number>(<unknown>lastBuildTimeStamp)))) {
    return true;
  }

  const dirTime = new Date(fs.statSync(sourceFolder).mtime);

  if (dirTime > lastBuildTimeStamp) {
    return true;
  }

  const fileUpdatedAfterLastBuild = glob
    .sync('**/*', { cwd: sourceFolder, ignore: ['bin', 'obj', '+(bin|obj)/**/*'] })
    .find((file) => new Date(fs.statSync(path.join(sourceFolder, file)).mtime) > lastBuildTimeStamp);

  return !!fileUpdatedAfterLastBuild;
};
