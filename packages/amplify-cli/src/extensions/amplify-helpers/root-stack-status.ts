import { pathManager } from 'amplify-cli-core';
import { rootStackFileName } from 'amplify-provider-awscloudformation';
import { hashElement, HashElementOptions } from 'folder-hash';
import * as fs from 'fs-extra';
import * as path from 'path';

export function getHashForRootStack(dirPath, files?: string[]) {
  const options: HashElementOptions = {
    files: {
      include: files,
    },
  };

  return hashElement(dirPath, options).then(result => result.hash);
}

export async function isRootStackModifiedSinceLastPush(hashFunction): Promise<boolean> {
  try {
    const projectPath = pathManager.findProjectRoot();
    const localBackendDir = pathManager.getRootStackBuildDirPath(projectPath!);
    const cloudBackendDir = pathManager.getCurrentCloudRootStackDirPath(projectPath!);
    if (fs.existsSync(localBackendDir)) {
      const localCfnBuffer = fs.readFileSync(path.join(localBackendDir, rootStackFileName));
      if (fs.existsSync(cloudBackendDir)) {
        const cloudCfnBuffer = fs.readFileSync(path.join(cloudBackendDir, rootStackFileName));
        return !localCfnBuffer.equals(cloudCfnBuffer);
      } else {
        return true;
      }
    } else {
      return false;
    }
  } catch (error) {
    throw new Error('Amplify Project not initialized.');
  }
}
