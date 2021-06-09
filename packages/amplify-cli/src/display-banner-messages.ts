import { $TSAny, BannerMessage, pathManager, stateManager } from 'amplify-cli-core';
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
  const hasDeprecatedLayerResources =
    Object.values(meta?.function || {}).filter(
      (resource: $TSAny) => resource?.service === 'LambdaLayer' && resource?.layerVersionMap !== undefined,
    ).length > 0;

  if (hasDeprecatedLayerResources && layerMigrationBannerMessage) {
    print.info('');
    print.warning(layerMigrationBannerMessage);
    print.info('');
  }
}
