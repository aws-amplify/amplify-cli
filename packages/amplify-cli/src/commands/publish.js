module.exports = {
  name: 'publish',
  run: async (context) => {
    context.amplify.constructExeInfo(context); 
    const { amplifyMeta } = context.exeInfo;
    if (!amplifyMeta.hosting || Object.keys(amplifyMeta.hosting).length < 1) {
      context.print.info('');
      context.print.error('Please add hosting to your project before publishing your project');
      context.print.info('Command: amplify hosting add');
      context.print.info('');
      return;
    }
    await context.amplify.pushResources(context);
    const frontendPlugins = context.amplify.getFrontendPlugins(context);
    const frontendHandlerModule =
      require(frontendPlugins[context.exeInfo.projectConfig.frontend]);
    frontendHandlerModule.publish(context);
  },
};