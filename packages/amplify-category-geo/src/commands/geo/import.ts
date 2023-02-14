import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { importResource } from '../../provider-controllers/import';

export const name = 'import';

export const run = async (context: $TSContext) => {
  try {
    return await importResource(context);
  } catch (error) {
    if (error.message) {
      printer.error(error.message);
    }
    printer.blankLine();
    if (error.stack) {
      printer.debug(error.stack);
    }
    printer.error('There was an error importing the geofence collection');
    context.usageData.emitError(error);
    process.exitCode = 1;
  }
  return undefined;
};
