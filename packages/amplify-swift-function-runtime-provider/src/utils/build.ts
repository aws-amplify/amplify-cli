import { BuildRequest, BuildResult } from 'amplify-function-plugin-interface';
import { executeCommand } from './helpers';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';

// buildResource fetches all dependencies declared in Package.swift and compiles the Swift source.
export const buildResource = async (request: BuildRequest): Promise<BuildResult> => {
  const projectPath = path.join(request.srcRoot);
  if (!request.lastBuildTimestamp || isBuildStale(projectPath, request.lastBuildTimestamp)) {
    // Install dependencies.
    executeCommand('swift', ['package', 'update'], projectPath);
    // Build source and dependencies.
    executeCommand('swift', ['build'], projectPath);

    return { rebuilt: true };
  }

  return { rebuilt: false };
};

const isBuildStale = (projectPath: string, lastBuildTimestamp: Date) => {
  // If the timestamp of the src directory is newer than last build, then a rebuild is required.
  const srcDir = path.join(projectPath, 'Sources', 'example');
  const dirTime = new Date(fs.statSync(srcDir).mtime);
  if (dirTime > lastBuildTimestamp) {
    return true;
  }

  const fileUpdatedAfterLastBuild = glob.sync(`${srcDir}/**`).find(file => new Date(fs.statSync(file).mtime) > lastBuildTimestamp);
  return !!fileUpdatedAfterLastBuild;
};
