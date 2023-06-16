import { ViewResourceTableParams, CLIParams, $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { showApiAuthAcm } from '@aws-amplify/amplify-category-api';

/**
 * Entry point for status command
 */
export const run = async (context: $TSContext): Promise<void> => {
  const cliParams: CLIParams = {
    cliCommand: context?.input?.command,
    // eslint-disable-next-line spellcheck/spell-checker
    cliSubcommands: context?.input?.subCommands,
    cliOptions: context?.input?.options ?? {},
  };

  const view = new ViewResourceTableParams(cliParams);
  if (context?.input?.subCommands?.includes('help')) {
    printer.info(view.getStyledHelp());
  } else if (cliParams.cliOptions?.api && cliParams.cliOptions?.acm) {
    try {
      if (typeof cliParams.cliOptions?.acm !== 'string') {
        // In this case we have no model name passed in so error out
        printer.error('You must pass in a model name for the acm option.');
        return;
      }

      await showApiAuthAcm(context, cliParams.cliOptions.acm);
    } catch (err) {
      printer.error(err?.message);
    }
  } else {
    await context.amplify.showStatusTable(view);
    await context.amplify.showHelpfulProviderLinks(context);
    await showAmplifyConsoleHostingStatus(context);
  }
};

const showAmplifyConsoleHostingStatus = async (context: $TSContext): Promise<void> => {
  // eslint-disable-next-line spellcheck/spell-checker
  const pluginInfo = context.amplify.getCategoryPluginInfo(context, 'hosting', 'amplifyhosting');
  if (pluginInfo && pluginInfo.packageLocation) {
    const { status } = await import(pluginInfo.packageLocation);
    if (status) {
      await status(context);
    }
  }
};
