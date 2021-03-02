import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';
import * as execa from 'execa';
import { BuildRequest, BuildResult, BuildType } from 'amplify-function-plugin-interface';
import { executableName } from '../constants';

export const build = async ({ srcRoot, lastBuildTimeStamp, buildType }: BuildRequest): Promise<BuildResult> => {
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
        throw new Error(`Unexpected buildType: [${buildType}]`);
    }
    const result = execa.sync(executableName, buildArguments, {
      cwd: sourceFolder,
    });

    if (result.exitCode !== 0) {
      throw new Error(`${executableName} build failed, exit code was ${result.exitCode}`);
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
    .find(file => new Date(fs.statSync(path.join(sourceFolder, file)).mtime) > lastBuildTimeStamp);

  return !!fileUpdatedAfterLastBuild;
};
