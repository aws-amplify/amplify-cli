import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

const subcommand = 'push';
const category = 'api';

export const name = subcommand;

export const run = async (context: $TSContext) => {
  const resourceName = context.parameters.first;
  context.amplify.constructExeInfo(context);
  return context.amplify.pushResources(context, category, resourceName).catch(async err => {
    printer.error('There was an error pushing the API resource');
    printer.error(err.toString());
    await context.usageData.emitError(err);
    process.exitCode = 1;
  });
};
