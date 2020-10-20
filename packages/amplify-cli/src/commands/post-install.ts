import { $TSContext, GetPackageAssetPaths, pathManager } from 'amplify-cli-core';
import { entries } from 'lodash';
import * as fs from 'fs-extra';
import * as path from 'path';

export const run = async (context: $TSContext) => {
  // clean any previous libs
  await fs.remove(pathManager.getAmplifyLibRoot());
  await fs.ensureDir(pathManager.getAmplifyLibRoot());
  // set env var to prevent errors due to no package libs
  process.env.AMPLIFY_SUPPRESS_NO_PKG_LIB = 'true';

  const pluginMetaList = entries(context.pluginPlatform.plugins)
    // can't use flatMap here as our target node version doesn't support it :(
    .reduce(
      (allPlugins, [_, categoryPlugins]) => allPlugins.concat(categoryPlugins),
      [] as { packageName: string; packageLocation: string }[],
    )
    .concat(additionalPackageRegistry.map(packageName => ({ packageName, packageLocation: path.parse(require.resolve(packageName)).dir })));

  await Promise.all(
    pluginMetaList.map(async pluginMeta => {
      const { getPackageAssetPaths } = (await import(pluginMeta.packageLocation)) as {
        getPackageAssetPaths: GetPackageAssetPaths;
      };
      if (typeof getPackageAssetPaths !== 'function') {
        return;
      }
      const pluginArtifactPaths = await getPackageAssetPaths();
      if (Array.isArray(pluginArtifactPaths) && pluginArtifactPaths.length > 0) {
        await Promise.all(
          pluginArtifactPaths.map(
            async assetPath =>
              await fs.copy(
                path.join(pluginMeta.packageLocation, assetPath),
                path.join(pathManager.getAmplifyPackageLibDirPath(pluginMeta.packageName), assetPath),
              ),
          ),
        );
      }
    }),
  );
  delete process.env.AMPLIFY_SUPPRESS_NO_PKG_LIB;
};

// Registry of packages that are NOT Amplify plugins which need binary files copied when the CLI is executing as a native binary
// Packages that are Amplify plugins do NOT need to be added to this list; they will be scanned automatically
const additionalPackageRegistry = ['amplify-dynamodb-simulator'];
