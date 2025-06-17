import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';
import { IChannelAvailability, INotificationsConfigStatus } from '../../channel-types';
import { getNotificationsAppMeta } from '../../notifications-amplify-meta-api';
import { getNotificationConfigStatus } from '../../notifications-api';
import { getChannelViewInfo } from '../../notifications-backend-cfg-channel-api';

export const name = 'status';
export const alias = ['list', 'ls'];

const viewStyles = {
  enabled: chalk.bold.green,
  disabled: chalk.bold.red,
  pendingDeployment: chalk.yellowBright,
  deployed: chalk.cyanBright,
  notDeployed: chalk.dim,
  url: chalk.bold.yellow,
  underline: chalk.blue.underline,
  appName: chalk.bold.yellowBright,
};

const getDeployedStyledStatus = (deployedChannel: string, deployedChannels: IChannelAvailability, configuredState: string): string => {
  printer.warn(`Amazon Pinpoint is reaching end of life on October 30, 2026 and no longer accepts new customers as of May 20, 2025.
    It is recommended you use use AWS End User Messaging for push notifications and SMS, Amazon Simple Email Service for sending emails, Amazon Connect for campaigns, journeys, endpoints, and engagement analytics.
    For more information see: https://docs.aws.amazon.com/pinpoint/latest/userguide/migrate.html`);

  if (deployedChannels.enabledChannels.includes(deployedChannel)) {
    if (configuredState === 'Enabled') {
      return viewStyles.deployed('Deployed');
    }
    return viewStyles.pendingDeployment('Not Deployed'); // remote state is disabled
  }
  if (deployedChannels.disabledChannels.includes(deployedChannel)) {
    if (configuredState === 'Disabled') {
      return viewStyles.deployed('Deployed');
    }
    return viewStyles.pendingDeployment('Not Deployed'); // remote state is enabled
  }
  return viewStyles.notDeployed('Not Deployed');
};

const viewNotificationsAppURL = async (context: $TSContext, appName: string): Promise<void> => {
  const meta = await getNotificationsAppMeta(context.exeInfo.amplifyMeta, appName);
  if (meta?.Id) {
    const consoleUrl = `https://${meta.Region}.console.aws.amazon.com/pinpoint/home/?region=${meta.Region}#/apps/${meta.Id}/notifications`;
    printer.info(`\nPinpoint App: ${viewStyles.underline(viewStyles.url(consoleUrl))}`);
  }
};

const viewDisplayChannelAvailability = async (context: $TSContext, backend: INotificationsConfigStatus): Promise<void> => {
  const tableOptions = [['Channel', 'Status', 'Deployed/Not Deployed']];
  for (const enabledChannel of backend.local.channels.enabledChannels) {
    const channelViewInfo = getChannelViewInfo(enabledChannel);
    tableOptions.push([
      channelViewInfo.viewName,
      viewStyles.enabled('Enabled'),
      getDeployedStyledStatus(enabledChannel, backend.deployed.channels, 'Enabled'),
    ]);
  }
  for (const disabledChannel of backend.local.channels.disabledChannels) {
    const channelViewInfo = getChannelViewInfo(disabledChannel);
    tableOptions.push([
      channelViewInfo.viewName,
      viewStyles.disabled('Disabled'),
      getDeployedStyledStatus(disabledChannel, backend.deployed.channels, 'Disabled'),
    ]);
  }
  context.print.table(tableOptions, { format: 'lean' });
};

const viewDisplayNotificationsResourceInfo = async (backend: INotificationsConfigStatus): Promise<void> => {
  printer.info(`\n\nApplication : ${viewStyles.appName(backend.local.config.serviceName)} (${backend.local.config.service})`);
};

/**
 *  Print the status of Pinpoint resource  and channels
 */
export const run = async (context: $TSContext): Promise<void> => {
  const backend = await getNotificationConfigStatus(context);
  if (backend) {
    await viewDisplayNotificationsResourceInfo(backend);
    await viewNotificationsAppURL(context, backend.local.config.serviceName);
    await viewDisplayChannelAvailability(context, backend);
  }
};
