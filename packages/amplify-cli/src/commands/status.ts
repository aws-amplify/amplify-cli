import { ViewResourceTableParams, CLIParams } from "amplify-cli-core/lib/cliViewAPI";


export const run = async context => {
  const cliParams:CLIParams  = { cliCommand : context?.input?.command,
                                 cliSubcommands: context?.input?.subCommands,
                                 cliOptions : context?.input?.options }
  const view = new ViewResourceTableParams( cliParams );
  if ( context?.input?.subCommands?.includes("help")){
     console.log( view.getStyledHelp())
  } else {
    await context.amplify.showStatusTable( view );
    await context.amplify.showHelpfulProviderLinks(context);
    await showAmplifyConsoleHostingStatus(context);
  }
};

async function showAmplifyConsoleHostingStatus( context) {
  const pluginInfo = context.amplify.getCategoryPluginInfo(context, 'hosting', 'amplifyhosting');
  if (pluginInfo && pluginInfo.packageLocation) {
    const { status } = require(pluginInfo.packageLocation);
    if (status) {
      await status(context);
    }
  }
}
