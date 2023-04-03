import { $TSAny, $TSContext, IAnalyticsResource, INotificationsResourceMeta, $TSMeta } from '@aws-amplify/amplify-cli-core';
import { ICategoryMeta } from './notifications-amplify-meta-types';
import { ChannelAction, ChannelConfigDeploymentType, IChannelAPIResponse } from './channel-types';
export declare const getPinpointApp: (context: $TSContext) => ICategoryMeta | undefined;
export declare const enum IPinpointDeploymentStatus {
    NO_ENV = "NO_ENV",
    APP_NOT_CREATED = "APP_NOT_CREATED",
    APP_IS_CREATED_NOT_DEPLOYED = "APP_IS_CREATED_NOT_DEPLOYED",
    APP_IS_DEPLOYED = "APP_IS_DEPLOYED_ANALYTICS",
    APP_IS_DEPLOYED_CUSTOM = "APP_IS_DEPLOYED_NOTIFICATIONS"
}
export interface IPinpointAppStatus {
    status: IPinpointDeploymentStatus;
    app: IAnalyticsResource | undefined;
    context: $TSContext;
}
export declare const isPinpointAppDeployed: (pinpointStatus: IPinpointDeploymentStatus) => boolean;
export declare const isPinpointDeploymentRequired: (channelName: string, pinpointAppStatus: IPinpointAppStatus) => boolean;
export declare const isPinpointAppOwnedByNotifications: (pinpointStatus: IPinpointDeploymentStatus) => boolean;
export declare const buildPinpointChannelResponseSuccess: (action: ChannelAction, deploymentType: ChannelConfigDeploymentType, channelName: string, output?: $TSAny) => IChannelAPIResponse;
export declare const getPinpointAppStatusNotifications: (notificationsMeta: $TSAny, amplifyMeta: $TSAny, envName: string) => ICategoryMeta | undefined;
export declare const getPinpointAppStatus: (context: $TSContext, amplifyMeta: $TSAny, pinpointNotificationsMeta: $TSAny, envName: string | undefined) => Promise<IPinpointAppStatus>;
export declare const viewShowAmplifyPushRequired: (pinpointStatus: IPinpointDeploymentStatus) => void;
export declare const getPinpointAppFromAnalyticsOutput: (analyticsMeta: IAnalyticsResource) => Partial<ICategoryMeta>;
export declare const updateContextFromAnalyticsOutput: (context: $TSContext, amplifyMeta: $TSMeta, pinpointAppStatus: IPinpointAppStatus) => Promise<Partial<ICategoryMeta> | undefined>;
export declare const createAnalyticsPinpointApp: (context: $TSContext) => Promise<void>;
export declare const getPinpointAppStatusFromMeta: (context: $TSContext, pinpointNotificationsMeta: INotificationsResourceMeta | undefined, appEnvName: string | undefined) => Promise<IPinpointAppStatus>;
export declare const pushAuthAndAnalyticsPinpointResources: (context: $TSContext, pinpointAppStatus: IPinpointAppStatus) => Promise<IPinpointAppStatus>;
export declare const ensurePinpointApp: (context: $TSContext, pinpointNotificationsMeta: $TSAny, appStatus?: IPinpointAppStatus, appEnvName?: string) => Promise<IPinpointAppStatus>;
export declare const deletePinpointApp: (context: $TSContext) => Promise<void>;
export declare const scanCategoryMetaForPinpoint: (categoryMeta: $TSAny, options: $TSAny) => ICategoryMeta | undefined;
export declare const console: (context: $TSContext) => Promise<void>;
export declare const getPinpointClient: (context: $TSContext, action: string, envName: string) => Promise<$TSAny>;
export declare const isAnalyticsAdded: (context: $TSContext) => boolean;
//# sourceMappingURL=pinpoint-helper.d.ts.map