import { $TSContext } from 'amplify-cli-core';
import * as notificationManager from '../../notifications-manager';

/**
 *  Print the status of Pinpoint resource  and channels
 */
const run = async (context:$TSContext):Promise<void> => {
  context.exeInfo = context.amplify.getProjectDetails();
  const enabledChannels = notificationManager.getEnabledChannelsFromBackendConfig();
  const disableChannels = notificationManager.getDisabledChannelsFromBackendConfig();

  const tableOptions = [['Channel', 'Status']];
  for (let i = 0; i < enabledChannels.length; i++) {
    tableOptions.push([enabledChannels[i], 'Enabled']);
  }
  for (let i = 0; i < disableChannels.length; i++) {
    tableOptions.push([disableChannels[i], 'Disabled']);
  }

  context.print.table(tableOptions, { format: 'markdown' });
};

module.exports = {
  name: 'status',
  alias: ['list', 'ls'],
  run,
};
