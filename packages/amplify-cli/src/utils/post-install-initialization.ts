import { GetPackageAssetPaths, pathManager } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * This function is run first thing after a new Amplify installation
 * It copies some assets needed by dependency packages to the .amplify folder
 */
export const postInstallInitialization = async () => {
  // clean any previous libs
  await fs.remove(pathManager.getAmplifyLibRoot());
  await fs.ensureDir(pathManager.getAmplifyLibRoot());

  // set env var to prevent errors due to no package libs
  process.env.AMPLIFY_SUPPRESS_NO_PKG_LIB = 'true';

  await Promise.all(
    copyPkgAssetRegistry.map(async packageName => {
      const { getPackageAssetPaths } = (await import(packageName)) as { getPackageAssetPaths: GetPackageAssetPaths };
      if (typeof getPackageAssetPaths !== 'function') {
        return;
      }
      const pluginArtifactPaths = await getPackageAssetPaths();
      if (!Array.isArray(pluginArtifactPaths)) {
        return;
      }
      await Promise.all(
        pluginArtifactPaths.map(assetPath =>
          fs.copy(
            path.join(resolvePackageRoot(packageName), assetPath),
            path.join(pathManager.getAmplifyPackageLibDirPath(packageName), assetPath),
          ),
        ),
      );
    }),
  );
  delete process.env.AMPLIFY_SUPPRESS_NO_PKG_LIB;
};

const resolvePackageRoot = (packageName: string) => {
  const resolveDir = path.parse(require.resolve(packageName)).dir;
  const pathParts = resolveDir.split(path.sep);
  return pathParts.slice(0, pathParts.indexOf(packageName) + 1).join(path.sep);
};

// Registry of packages that have files that need to be copied to the .amplify folder on CLI installation
const copyPkgAssetRegistry = [
  'amplify-dynamodb-simulator',
  'amplify-frontend-ios',
  'amplify-go-function-runtime-provider',
  'amplify-java-function-runtime-provider',
  'amplify-python-function-runtime-provider',
];
