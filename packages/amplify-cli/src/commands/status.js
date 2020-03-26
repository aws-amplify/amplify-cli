module.exports = {
  name: 'status',
  alias: ['ls'],
  run: async context => {
    await context.amplify.showResourceTable();
    await context.amplify.showHelpfulProviderLinks(context);
    await showAmplifyConsoleHostingStatus(context);
  },
};

async function showAmplifyConsoleHostingStatus(context) {
  const pluginInfo = context.amplify.getCategoryPluginInfo(context, 'hosting', 'amplifyhosting');
  if (pluginInfo && pluginInfo.packageLocation) {
    const { status } = require(pluginInfo.packageLocation);
    if (status) {
      await status(context);
    }
  }
}
