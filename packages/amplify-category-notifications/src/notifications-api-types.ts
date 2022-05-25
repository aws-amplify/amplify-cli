/**
 * This file will contain the structures required for headless API
 */
import { $TSContext } from 'amplify-cli-core';
import { AnalyticsCapabilityAPIResponse } from './analytics-resource-api';

/**
 * Actions performed on a Notifications channel (Pinpoint)
 */
export enum ChannelAction {
    ENABLE = 'enable',
    DISABLE = 'disable',
    CONFIGURE = 'configure',
    PULL = 'pull'
  }

/**
 * Response structure for a Notifications channel API
 */
export interface IChannelAPIResponse {
    action: ChannelAction,
    channel: string,
    response: AnalyticsCapabilityAPIResponse,
}

/**
 * Notifications Channel API function signatures
 */
export type NotificationsChannelActionHandler = {
     description: 'Notifications-API: NotificationsChannel API Handler function';
     (context: $TSContext, pinpointAppName?:string): Promise<IChannelAPIResponse|undefined>;
  };

/**
 * Notifications Channel API module
 */
export type NotificationsChannelAPIModule = Record<ChannelAction, NotificationsChannelActionHandler>;
