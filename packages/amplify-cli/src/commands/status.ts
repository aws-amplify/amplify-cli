import { ViewResourceTableParams, CLIParams, $TSContext } from 'amplify-cli-core';

export const run = async (context: $TSContext) => {
  const cliParams: CLIParams = {
    cliCommand: context?.input?.command,
    cliSubcommands: context?.input?.subCommands,
    cliOptions: context?.input?.options,
  };

  const view = new ViewResourceTableParams(cliParams);
  if (context?.input?.subCommands?.includes('help')) {
    context.print.info(view.getStyledHelp());
  } else {
    try {
      await context.amplify.showStatusTable(view);
      await context.amplify.showGlobalSandboxModeWarning(context);
      await context.amplify.showHelpfulProviderLinks(context);
      await showAmplifyConsoleHostingStatus(context);
    } catch (e) {
      view.logErrorException(e, context);
    }
  }
};

async function showAmplifyConsoleHostingStatus(context) {
  const pluginInfo = context.amplify.getCategoryPluginInfo(context, 'hosting', 'amplifyhosting');
  if (pluginInfo && pluginInfo.packageLocation) {
    const { status } = await import(pluginInfo.packageLocation);
    if (status) {
      await status(context);
    }
  }
}
