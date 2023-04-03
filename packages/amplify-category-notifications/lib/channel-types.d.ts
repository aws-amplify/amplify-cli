import { $TSAny, $TSContext, IPluginCapabilityAPIResponse } from '@aws-amplify/amplify-cli-core';
import { INotificationsResourceBackendConfig } from './notifications-backend-cfg-types';
export declare enum ChannelAction {
    ENABLE = "enable",
    DISABLE = "disable",
    CONFIGURE = "configure",
    PULL = "pull"
}
export declare enum ChannelConfigDeploymentType {
    INLINE = "INLINE",
    DEFERRED = "DEFERRED"
}
export interface IChannelAPIResponse {
    action: ChannelAction;
    channel: string;
    response: IPluginCapabilityAPIResponse;
    output?: $TSAny;
    deploymentType: ChannelConfigDeploymentType;
}
export interface IChannelAvailability {
    enabledChannels: Array<string>;
    disabledChannels: Array<string>;
}
export interface IChannelViewInfo {
    channelName: string;
    viewName: string;
    help: string;
    module: string;
    deploymentType: ChannelConfigDeploymentType;
}
export interface INotificationsConfigChannelAvailability {
    config: INotificationsResourceBackendConfig;
    channels: IChannelAvailability;
}
export interface INotificationsConfigStatus {
    local: INotificationsConfigChannelAvailability;
    deployed: INotificationsConfigChannelAvailability;
    appInitialized: false;
}
export type NotificationsChannelActionHandler = {
    description: 'Notifications-API: NotificationsChannel API Handler function';
    (context: $TSContext, pinpointAppName?: string): Promise<IChannelAPIResponse | undefined>;
};
export type NotificationsChannelAPIModule = Record<ChannelAction, NotificationsChannelActionHandler>;
//# sourceMappingURL=channel-types.d.ts.map