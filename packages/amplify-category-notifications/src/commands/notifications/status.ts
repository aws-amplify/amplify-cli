import {
  $TSContext,
} from 'amplify-cli-core';
import chalk from 'chalk';
import { IChannelAvailability, INotificationsConfigStatus } from '../../notifications-api-types';
import { NotificationsDB } from '../../notifications-backend-cfg-api';

const viewStyles = {
  enabled: chalk.bold.green,
  disabled: chalk.bold.red,
  notDeployed: chalk.dim,
};

const getDeployedStyledStatus = (deployedChannel: string, deployedChannels: IChannelAvailability): string => {
  if (deployedChannels.enabledChannels.includes(deployedChannel)) {
    return viewStyles.enabled('Enabled');
  }
  return (deployedChannels.disabledChannels.includes(deployedChannel))
    ? viewStyles.disabled('Disabled')
    : viewStyles.notDeployed('Not Deployed');
};

const viewDisplayChannelAvailability = async (context: $TSContext, backend:INotificationsConfigStatus): Promise<void> => {
  const tableOptions = [['Channel', 'Status', 'Deployed Status']];
  for (const enabledChannel of backend.local.channels.enabledChannels) {
    tableOptions.push([enabledChannel, viewStyles.enabled('Enabled'), getDeployedStyledStatus(enabledChannel, backend.deployed.channels)]);
  }
  for (const disabledChannel of backend.local.channels.disabledChannels) {
    tableOptions.push([disabledChannel, viewStyles.disabled('Disabled'), getDeployedStyledStatus(disabledChannel, backend.deployed.channels)]);
  }
  context.print.table(tableOptions, { format: 'lean' });
};

const viewDisplayNotificationsResourceInfo = async (context: $TSContext, backend:INotificationsConfigStatus):Promise<void> => {
  context.print.info(`Application Name: ${backend.local.config.serviceName} (${backend.local.config.service})`);
};

/**
 *  Print the status of Pinpoint resource  and channels
 */
export const run = async (context:$TSContext):Promise<void> => {
  context.exeInfo = context.amplify.getProjectDetails();
  const backend: INotificationsConfigStatus|undefined = await NotificationsDB.ChannelAPI.getNotificationConfigStatus(context);
  if (backend) {
    await viewDisplayNotificationsResourceInfo(context, backend);
    await viewDisplayChannelAvailability(context, backend);
  }
};

module.exports = {
  name: 'status',
  alias: ['list', 'ls'],
  run,
};
