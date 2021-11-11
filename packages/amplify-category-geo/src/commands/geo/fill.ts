import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { fillResource } from '../../provider-controllers/fill';

export const name = 'fill';

export const run = async (context: $TSContext) => {
  const { amplify } = context;
  try {
    printer.info('amplify geo fill command');
    return await fillResource(context);
  } catch (error: $TSAny) {
    if (error.message) {
      printer.error(error.message);
    }
    printer.blankLine();
    if (error.stack) {
      printer.info(error.stack);
    }
    printer.error('There was an error adding/updating the geofence collection');
    context.usageData.emitError(error);
    process.exitCode = 1;
  }
};