import { $TSAny, BannerMessage, pathManager, stateManager, skipHooks } from 'amplify-cli-core';
import { isCI } from 'ci-info';
import { printer } from 'amplify-prompts';
import { Input } from './domain/input';

export async function displayBannerMessages(input: Input) {
  const excludedCommands = ['delete', 'env', 'help', 'logout', 'version'];
  if (isCI || (input.command && excludedCommands.includes(input.command))) {
    return;
  }
  await displayLayerMigrationMessage();
  if (skipHooks()) {
    printer.warn('Amplify command hooks are disabled in the current execution environment.');
    printer.warn('See https://docs.amplify.aws/cli/usage/command-hooks/ for more information.');
  }
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
    printer.blankLine();
    printer.warn(layerMigrationBannerMessage);
    printer.blankLine();
  }
}
