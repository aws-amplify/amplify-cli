import { BannerMessage, pathManager, stateManager } from 'amplify-cli-core';
import { print } from './context-extensions';

export async function displayBannerMessages() {
  await displayLayerMigrationMessage();
}

async function displayLayerMigrationMessage() {
  const layerMigrationBannerMessage = await BannerMessage.getMessage('LAMBDA_LAYER_MIGRATION_WARNING');

  const rootPath = pathManager.findProjectRoot();

  if (rootPath === undefined) {
    // Not in a valid project
    return;
  }

  const meta = stateManager.getMeta(rootPath, { throwIfNotExist: false });
  const layerResources =
    meta !== undefined
      ? Object.keys(meta?.function).filter(
          resource => meta.function[resource]?.service === 'LambdaLayer' && meta.function[resource]?.layerVersionMap !== undefined,
        )
      : [];

  if (layerResources.length > 0 && layerMigrationBannerMessage) {
    print.info('');
    print.warning(layerMigrationBannerMessage);
    print.info('');
  }
}
