/* eslint-disable max-depth */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as path from 'path';
import sequential from 'promise-sequential';
import {
  $TSAny, $TSContext, stateManager,
} from 'amplify-cli-core';
import * as pinpointHelper from './pinpoint-helper';
import {
  IChannelAPIResponse, NotificationsChannelAPIModule,
} from './notifications-api-types';
import { NotificationsDB as Notifications } from './notifications-backend-cfg-api';

/**
 * Enable the selected notification channel
 */
export const enableChannel = async (context:$TSContext, channelName:string): Promise<IChannelAPIResponse|undefined> => {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  if (channelName in Notifications.ChannelAPI.channelWorkers) {
    context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
    const channelActionHandler:NotificationsChannelAPIModule = require(path.join(__dirname,
      Notifications.ChannelAPI.channelWorkers[channelName]));
    const enableChannelResponse = await channelActionHandler.enable(context);
    console.log('SACPCDEBUG: EnableChannel Debug : enableChannelResponse: ', enableChannelResponse);
    return enableChannelResponse;
  }
  throw new Error(`Enable failed: invalid notification channel ${channelName}`);
};

/**
 * Disable the notification channels in use.
 */
export const disableChannel = async (context : $TSContext, channelName: string): Promise<IChannelAPIResponse|undefined> => {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  if (Notifications.ChannelAPI.isValidChannel(channelName)) {
    context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
    const channelActionHandler:NotificationsChannelAPIModule = require(path.join(__dirname,
      Notifications.ChannelAPI.channelWorkers[channelName]));
    const enableChannelResponse = await channelActionHandler.disable(context);
    return enableChannelResponse;
  }
  return undefined;
};

/**
 * Configure the Pinpoint resources,
 * Also create the required IAM policy to allow Pinpoint to trigger notifications
 */
export const configureChannel = async (context: $TSContext, channelName: string):Promise<IChannelAPIResponse|undefined> => {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured

  if (channelName in Notifications.ChannelAPI.channelWorkers) {
    context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
    if (context.exeInfo.serviceMeta.mobileHubMigrated === true) {
      context.print.error('No resources to update.');
      return undefined;
    }

    const channelActionHandler:NotificationsChannelAPIModule = require(path.join(__dirname,
      Notifications.ChannelAPI.channelWorkers[channelName]));
    const enableChannelResponse = await channelActionHandler.configure(context);
    return enableChannelResponse;
  }
  return undefined;
};

/**
 * Fetch all the configured channels from pinpoint
 */
export const pullAllChannels = async (context: $TSContext, pinpointAppName: string):Promise<Array<IChannelAPIResponse>> => {
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  const pullTasks: Array<$TSAny> = [];
  context.exeInfo.pinpointClient = await pinpointHelper.getPinpointClient(context, 'update', envName);
  Object.keys(Notifications.ChannelAPI.channelWorkers).forEach(channelName => {
    const channelActionHandler:NotificationsChannelAPIModule = require(path.join(__dirname,
      Notifications.ChannelAPI.channelWorkers[channelName]));
    pullTasks.push(() => channelActionHandler.pull(context, pinpointAppName));
  });
  const pullChannelsResponseList : Array<IChannelAPIResponse> = await sequential(pullTasks);
  return pullChannelsResponseList;
};
