import { BannerMessage, pathManager, stateManager } from 'amplify-cli-core';
import { isCI } from 'ci-info';
import { print } from './context-extensions';
import { Input } from './domain/input';

export async function displayBannerMessages(input: Input) {
  const excludedCommands = ['delete', 'env', 'help', 'logout', 'version'];
  if (isCI || (input.command && excludedCommands.includes(input.command))) {
    return;
  }
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
      ? Object.keys(meta.function || {}).filter(
          resource => meta.function[resource]?.service === 'LambdaLayer' && meta.function[resource]?.layerVersionMap !== undefined,
        )
      : [];

  if (layerResources.length > 0 && layerMigrationBannerMessage) {
    print.info('');
    print.warning(layerMigrationBannerMessage);
    print.info('');
  }
}
