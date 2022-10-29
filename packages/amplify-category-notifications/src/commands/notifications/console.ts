import { $TSContext } from 'amplify-cli-core';
import * as pinpointHelper from '../../pinpoint-helper';

export const name = 'console';

/**
 * Opens AWS console for Pinpoint resource
 * @param context amplify cli context
 */
export const run = async (context: $TSContext): Promise<void> => {
  pinpointHelper.console(context);
};
