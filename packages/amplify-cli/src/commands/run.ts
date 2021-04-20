import { $TSContext } from 'amplify-cli-core';

export const run = async (context: $TSContext) => {
  context.amplify.constructExeInfo(context);
  await context.amplify.pushResources(context);

  const frontendPlugins = context.amplify.getFrontendPlugins(context);
  const frontendHandlerModule = require(frontendPlugins[context.exeInfo.projectConfig.frontend]);
  await frontendHandlerModule.run(context);
};
