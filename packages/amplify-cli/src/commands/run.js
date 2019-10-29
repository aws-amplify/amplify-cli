module.exports = {
  name: 'run',
  alias: ['serve'],
  run: async context => {
    context.amplify.constructExeInfo(context);
    await context.amplify.pushResources(context);

    const frontendPlugins = context.amplify.getFrontendPlugins(context);
    const frontendHandlerModule = require(frontendPlugins[context.exeInfo.projectConfig.frontend]);
    await frontendHandlerModule.run(context);
  },
};
