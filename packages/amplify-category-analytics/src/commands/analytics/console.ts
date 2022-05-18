import { $TSAny, $TSContext } from 'amplify-cli-core';
import { analyticsConsole } from '../../index';

/**
 * Open the AWS console for Analytics resource
 */
export const run = async (context : $TSContext):Promise<$TSAny> => analyticsConsole(context);
module.exports = {
  name: 'console',
  run,
};
