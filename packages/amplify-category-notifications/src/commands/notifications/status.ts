import { $TSContext } from 'amplify-cli-core';
import { getEnabledChannels, getDisabledChannels } from '../../notifications-manager';

export const name = 'status';
export const alias = ['list', 'ls'];

/**
 *  Print the status of Pinpoint resource  and channels
 */
export const run = async (context: $TSContext) : Promise<void> => {
  context.exeInfo = context.amplify.getProjectDetails();
  const enabledChannels = getEnabledChannels(context);
  const disableChannels = getDisabledChannels(context);

  const tableOptions = [['Channel', 'Status']];
  for (const enabledChannel of enabledChannels) {
    tableOptions.push([enabledChannel, 'Enabled']);
  }
  for (const disableChannel of disableChannels) {
    tableOptions.push([disableChannel, 'Disabled']);
  }

  context.print.table(tableOptions, { format: 'markdown' });
};
