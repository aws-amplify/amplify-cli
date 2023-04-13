import { $TSAny, BannerMessage, pathManager, stateManager, skipHooks } from '@aws-amplify/amplify-cli-core';
import { CLIInput } from './domain/command-input';
import { isCI } from 'ci-info';
import { printer } from '@aws-amplify/amplify-prompts';

/**
 * display banner messages
 */
export const displayBannerMessages = async (input: CLIInput): Promise<void> => {
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
        'The Amazon Sumerian service is no longer accepting new customers.' +
          ' Existing customer scenes will not be available after February 21, 2023.' +
          ' The AWS Amplify XR features depend on the Amazon Sumerian service to function and as a result, will no longer be available.',
      );
      printer.blankLine();
    }
  }
};
