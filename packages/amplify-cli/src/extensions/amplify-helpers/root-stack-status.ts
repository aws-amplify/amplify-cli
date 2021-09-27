import { pathManager } from 'amplify-cli-core';
import { rootStackFileName } from 'amplify-provider-awscloudformation';
import { hashElement, HashElementOptions } from 'folder-hash';
import * as fs from 'fs-extra';

export function getHashForRootStack(dirPath, files?: string[]) {
  const options: HashElementOptions = {
    folders: { exclude: ['.*', 'node_modules', 'test_coverage', 'dist', 'build'] },
    files: {
      include: files,
    },
  };

  return hashElement(dirPath, options).then(result => result.hash);
}

export async function isRootStackModifiedSinceLastPush(hashFunction): Promise<boolean> {
  try {
    const projectPath = pathManager.findProjectRoot();
    const localBackendDir = pathManager.getRootStackDirPath(projectPath!);
    const cloudBackendDir = pathManager.getCurrentCloudRootStackDirPath(projectPath!);
    if (fs.existsSync(localBackendDir)) {
      const localDirHash = await hashFunction(localBackendDir, [rootStackFileName]);
      if (fs.existsSync(cloudBackendDir)) {
        const cloudDirHash = await hashFunction(cloudBackendDir, [rootStackFileName]);
        return localDirHash !== cloudDirHash;
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
