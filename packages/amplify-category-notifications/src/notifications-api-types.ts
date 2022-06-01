/**
 * This file will contain the structures required for headless API
 */
import { $TSAny, $TSContext, IPluginCapabilityAPIResponse } from 'amplify-cli-core';

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
 * Channel config deployment types.
 * note: INLINE deployment will be phased out after the implementation of
 * DEFERRED deployment( and rollback ) for SDK deployed resources.
 */
export enum ChannelConfigDeploymentType {
    INLINE = 'INLINE', // channel config is deployed as soon as its configured
    DEFERRED = 'DEFERRED', // channel config is deployed only on amplify-push
}

/**
 * Response structure for a Notifications channel API
 */
export interface IChannelAPIResponse {
    action: ChannelAction,
    channel: string,
    response: IPluginCapabilityAPIResponse,
    output?: $TSAny, // Channel API response
    deploymentType: ChannelConfigDeploymentType,
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
