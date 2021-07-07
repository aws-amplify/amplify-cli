import { ViewResourceTableParams, CLIParams } from "amplify-cli-core/lib/cliViewAPI";


export const run = async context => {
  const cliParams:CLIParams  = { cliCommand : context.input.command,
                                   cliOptions : context.input.options }
  await context.amplify.showStatusTable( new ViewResourceTableParams( cliParams ) );
  await context.amplify.showHelpfulProviderLinks(context);
  await showAmplifyConsoleHostingStatus(context);
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
