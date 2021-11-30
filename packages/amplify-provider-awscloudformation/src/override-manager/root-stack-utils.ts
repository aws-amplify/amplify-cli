import { pathManager } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { rootStackFileName } from '..';

export const isMigrateProject = () => {
  const projRoot = pathManager.findProjectRoot();
  const buildProviderPath = pathManager.getRootStackBuildDirPath(projRoot);
  if (fs.existsSync(buildProviderPath) && fs.existsSync(path.join(buildProviderPath, rootStackFileName))) {
    return false;
  } else {
    return true;
  }
};

export const isRootOverrideFileModifiedSinceLastPush = () => {
  const projectPath = pathManager.findProjectRoot();
  const localBackendDir = pathManager.getRootStackBuildDirPath(projectPath!);
  const cloudBackendDir = pathManager.getCurrentCloudRootStackDirPath(projectPath!);
  if (fs.existsSync(localBackendDir) && fs.existsSync(path.join(localBackendDir, '..', 'override.ts'))) {
    const localCfnBuffer = fs.readFileSync(path.join(localBackendDir, '..', 'override.ts'));
    if (fs.existsSync(cloudBackendDir) && fs.existsSync(path.join(cloudBackendDir, '..', 'override.ts'))) {
      const cloudCfnBuffer = fs.readFileSync(path.join(cloudBackendDir, '..', 'override.ts'));
      return !localCfnBuffer.equals(cloudCfnBuffer);
    } else {
      return true;
    }
  } else {
    return false;
  }
};
