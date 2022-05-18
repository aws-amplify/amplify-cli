import { $TSContext } from 'amplify-cli-core';
import * as pinpointHelper from '../../pinpoint-helper';

/**
 * Opens AWS console for Pinpoint resource
 * @param context amplify cli context
 */
export const run = async (context:$TSContext):Promise<void> => {
  context.exeInfo = context.amplify.getProjectDetails();
  pinpointHelper.channelInAppConsole(context);
};

module.exports = {
  name: 'console',
  run,
};
