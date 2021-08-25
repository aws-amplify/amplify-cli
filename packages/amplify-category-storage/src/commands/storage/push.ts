import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { categoryName } from '../../constants';

export const name = 'push'; // subcommand

export async function run(context: $TSContext) {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;

  context.amplify.constructExeInfo(context);

  return amplify.pushResources(context, categoryName, resourceName).catch(async (err: Error) => {
    printer.error(`An error occurred when pushing the storage resource: ${err?.message || err}`);
    await context.usageData.emitError(err);
    process.exitCode = 1;
  });
}
