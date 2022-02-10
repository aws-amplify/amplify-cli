import { $TSContext, AmplifyCategories } from 'amplify-cli-core';

const subcommand = 'push';

export const name = subcommand;

export const run = async (context: $TSContext) => {
  const resourceName = context.parameters.first;
  context.amplify.constructExeInfo(context);
  return context.amplify.pushResources(context, AmplifyCategories.API, resourceName);
};
