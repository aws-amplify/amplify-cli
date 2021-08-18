import { pathManager } from 'amplify-cli-core';
import { rootStackFileName } from 'amplify-provider-awscloudformation';
import { hashElement, HashElementOptions } from 'folder-hash';

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

    const localDirHash = await hashFunction(localBackendDir, [rootStackFileName]);
    const cloudDirHash = await hashFunction(cloudBackendDir, [rootStackFileName]);

    return localDirHash !== cloudDirHash;
  } catch (error) {
    throw new Error('Amplify Project not initialized.');
  }
}
