import { $TSContext, $TSMeta, IAmplifyResource, IAnalyticsResource, IPluginCapabilityAPIResponse, NotificationChannels } from '@aws-amplify/amplify-cli-core';
export declare const invokeAnalyticsAPIGetResources: (context: $TSContext, resourceProviderServiceName?: string) => Promise<Array<IAnalyticsResource>>;
export declare const invokeAnalyticsAPICreateResource: (context: $TSContext, resourceProviderServiceName: string) => Promise<IAmplifyResource>;
export declare const invokeAnalyticsResourceToggleNotificationChannel: (context: $TSContext, resourceProviderServiceName: string, channel: NotificationChannels, enableChannel: boolean) => Promise<IPluginCapabilityAPIResponse>;
export declare const invokeGetLastPushTimeStamp: (amplifyMeta: $TSMeta, analyticsResourceName: string) => Promise<string | undefined>;
export declare const invokeAnalyticsPush: (context: $TSContext, analyticsResourceName: string) => Promise<IPluginCapabilityAPIResponse>;
export declare const invokeAnalyticsPinpointHasInAppMessagingPolicy: (context: $TSContext) => Promise<boolean>;
export declare const invokeAnalyticsMigrations: (context: $TSContext) => Promise<void>;
//# sourceMappingURL=plugin-client-api-analytics.d.ts.map