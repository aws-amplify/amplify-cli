import {
  $TSContext,
} from 'amplify-cli-core';
import chalk from 'chalk';
import { IChannelAvailability, INotificationsConfigStatus } from '../../notifications-api-types';
import { NotificationsDB } from '../../notifications-backend-cfg-api';
import { ChannelAPI } from '../../notifications-backend-cfg-channel-api';
import { NotificationsMeta } from '../../notifications-meta-api';

const viewStyles = {
  enabled: chalk.bold.green,
  disabled: chalk.bold.red,
  notDeployed: chalk.dim,
  url: chalk.bold.yellow,
  underline: chalk.blue.underline,
  appName: chalk.bold.yellowBright,
};

const getDeployedStyledStatus = (deployedChannel: string, deployedChannels: IChannelAvailability): string => {
  if (deployedChannels.enabledChannels.includes(deployedChannel)) {
    return viewStyles.enabled('Enabled');
  }
  return (deployedChannels.disabledChannels.includes(deployedChannel))
    ? viewStyles.disabled('Disabled')
    : viewStyles.notDeployed('Not Deployed');
};

const viewNotificationsAppURL = async (context: $TSContext, appName: string): Promise<void> => {
  const meta = await NotificationsMeta.getNotificationsAppMeta(context.exeInfo.amplifyMeta, appName);
  if (meta?.Id) {
    const consoleUrl = `https://${meta.Region}.console.aws.amazon.com/pinpoint/home/?region=${meta.Region}#/apps/${meta.Id}/notifications`;
    context.print.info(`\nPinpoint App: ${viewStyles.underline(viewStyles.url(consoleUrl))}`);
  }
};

const viewDisplayChannelAvailability = async (context: $TSContext, backend:INotificationsConfigStatus): Promise<void> => {
  const tableOptions = [['Channel', 'Status', 'Deployed Status']];
  for (const enabledChannel of backend.local.channels.enabledChannels) {
    const channelViewInfo = ChannelAPI.getChannelViewInfo(enabledChannel);
    tableOptions.push([channelViewInfo.viewName, viewStyles.enabled('Enabled'), getDeployedStyledStatus(enabledChannel, backend.deployed.channels)]);
  }
  for (const disabledChannel of backend.local.channels.disabledChannels) {
    const channelViewInfo = ChannelAPI.getChannelViewInfo(disabledChannel);
    tableOptions.push([channelViewInfo.viewName, viewStyles.disabled('Disabled'), getDeployedStyledStatus(disabledChannel, backend.deployed.channels)]);
  }
  context.print.table(tableOptions, { format: 'lean' });
};

const viewDisplayNotificationsResourceInfo = async (context: $TSContext, backend:INotificationsConfigStatus):Promise<void> => {
  context.print.info(`\n\nApplication : ${viewStyles.appName(backend.local.config.serviceName)} (${backend.local.config.service})`);
};

/**
 *  Print the status of Pinpoint resource  and channels
 */
export const run = async (context:$TSContext):Promise<void> => {
  context.exeInfo = context.amplify.getProjectDetails();
  const backend: INotificationsConfigStatus|undefined = await NotificationsDB.ChannelAPI.getNotificationConfigStatus(context);
  if (backend) {
    await viewDisplayNotificationsResourceInfo(context, backend);
    await viewNotificationsAppURL(context, backend.local.config.serviceName);
    await viewDisplayChannelAvailability(context, backend);
  }
};

module.exports = {
  name: 'status',
  alias: ['list', 'ls'],
  run,
};
