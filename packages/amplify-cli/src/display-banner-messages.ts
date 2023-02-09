import { $TSAny, BannerMessage, pathManager, stateManager, skipHooks, CommandLineInput } from 'amplify-cli-core';
import { isCI } from 'ci-info';
import { printer } from 'amplify-prompts';

/**
 * display banner messages
 */
export const displayBannerMessages = async (input: CommandLineInput): Promise<void> => {
  const excludedCommands = ['delete', 'env', 'help', 'logout', 'version'];
  if (isCI || (input.command && excludedCommands.includes(input.command))) {
    return;
  }
  await displayLayerMigrationMessage();
  await displayXrDeprecationMessage();
  if (skipHooks()) {
    printer.warn('Amplify command hooks are disabled in the current execution environment.');
    printer.warn('See https://docs.amplify.aws/cli/usage/command-hooks/ for more information.');
  }
};

const displayLayerMigrationMessage = async (): Promise<void> => {
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
};

const displayXrDeprecationMessage = async (): Promise<void> => {
  const rootPath = pathManager.findProjectRoot();
  if (rootPath === undefined) {
    // Not in a valid project
    return;
  }

  const meta = stateManager.getMeta(rootPath, { throwIfNotExist: false });
  if (meta) {
    const hasXr = 'xr' in meta;
    if (hasXr) {
      printer.blankLine();
      printer.warn(
        'The XR category depends on Amazon Sumerian to function.' +
          ' Amazon Sumerian scenes will not be accessible as of February 21, 2023.' +
          ' Follow the documentation on this page https://docs.amplify.aws/lib/xr/getting-started/q/platform/js/' +
          ' to learn more about your migration options.',
      );
      printer.blankLine();
    }
  }
};
