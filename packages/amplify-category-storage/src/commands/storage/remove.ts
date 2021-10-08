import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { categoryName } from '../../constants';

export const name = 'remove'; // subcommand

export async function run(context: $TSContext) {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;

  return amplify.removeResource(context, categoryName, resourceName).catch(async (err: $TSAny) => {
    printer.info(err.stack);
    printer.error('An error occurred when removing the storage resource');

    await context.usageData.emitError(err);

    process.exitCode = 1;
  });
}
