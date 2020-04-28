import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';
import * as execa from 'execa';
import { BuildRequest, BuildResult } from 'amplify-function-plugin-interface';
import { executableName } from '../constants';

export const build = async (request: BuildRequest): Promise<BuildResult> => {
  return buildCore(request, 'Release');
};

export const buildCore = async (request: BuildRequest, configuration: 'Release' | 'Debug'): Promise<BuildResult> => {
  const distPath = path.join(request.srcRoot, 'dist');
  const sourceFolder = path.join(request.srcRoot, 'src');
  if (
    configuration === 'Debug' || // Always refresh for mock builds
    !request.lastBuildTimestamp ||
    !fs.existsSync(distPath) ||
    isBuildStale(sourceFolder, request.lastBuildTimestamp)
  ) {
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath);
    }

    const result = execa.sync(executableName, ['publish', '-c', configuration, '-o', distPath], {
      cwd: sourceFolder,
    });

    if (result.exitCode !== 0) {
      throw new Error(`${executableName} build failed, exit code was ${result.exitCode}`);
    }

    return { rebuilt: true };
  }

  return { rebuilt: false };
};

const isBuildStale = (sourceFolder: string, lastBuildTimestamp: Date) => {
  // Guard against invalid timestamp
  if (!(lastBuildTimestamp instanceof Date && !isNaN(<number>(<unknown>lastBuildTimestamp)))) {
    return true;
  }

  const dirTime = new Date(fs.statSync(sourceFolder).mtime);

  if (dirTime > lastBuildTimestamp) {
    return true;
  }

  const fileUpdatedAfterLastBuild = glob
    .sync('**/*', { cwd: sourceFolder, ignore: ['bin', 'obj', '+(bin|obj)/**/*'] })
    .find(file => new Date(fs.statSync(path.join(sourceFolder, file)).mtime) > lastBuildTimestamp);

  return !!fileUpdatedAfterLastBuild;
};
