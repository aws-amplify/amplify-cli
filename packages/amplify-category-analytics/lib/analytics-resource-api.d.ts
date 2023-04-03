import { IAmplifyResource, $TSContext, IAnalyticsResource, NotificationChannels, IPluginCapabilityAPIResponse } from '@aws-amplify/amplify-cli-core';
export declare const analyticsPluginAPIGetResources: (resourceProviderServiceName?: string, context?: $TSContext) => Array<IAnalyticsResource>;
export declare const analyticsPluginAPICreateResource: (context: $TSContext, resourceProviderServiceName: string) => Promise<IAmplifyResource>;
export declare const analyticsPluginAPIToggleNotificationChannel: (resourceProviderServiceName: string, channel: NotificationChannels, enableChannel: boolean) => Promise<IPluginCapabilityAPIResponse>;
export declare const analyticsPluginAPIPush: (context: $TSContext, resourceProviderServiceName: string) => Promise<IPluginCapabilityAPIResponse>;
export declare const analyticsPushYes: (context: $TSContext) => Promise<void>;
export declare const analyticsPluginAPIPostPush: (context: $TSContext) => Promise<$TSContext>;
export declare const analyticsPluginAPIPinpointHasInAppMessagingPolicy: (context: $TSContext) => Promise<boolean>;
export declare const analyticsPluginAPIMigrations: (context: $TSContext) => Promise<void>;
//# sourceMappingURL=analytics-resource-api.d.ts.map