import { $TSContext, $TSAny } from '@aws-amplify/amplify-cli-core';
export { migrate } from './provider-utils/awscloudformation/service-walkthroughs/pinpoint-walkthrough';
export { analyticsPluginAPIGetResources, analyticsPluginAPICreateResource, analyticsPluginAPIToggleNotificationChannel, analyticsPluginAPIPinpointHasInAppMessagingPolicy, analyticsPluginAPIMigrations, analyticsPluginAPIPostPush, analyticsPluginAPIPush, } from './analytics-resource-api';
export declare const console: (context: $TSContext) => Promise<void>;
export declare const getPermissionPolicies: (context: $TSContext, resourceOpsMapping: {
    [x: string]: any;
}) => Promise<$TSAny>;
export declare const executeAmplifyCommand: (context: $TSContext) => Promise<$TSAny>;
export declare const handleAmplifyEvent: (__context: $TSContext, args: $TSAny) => Promise<void>;
//# sourceMappingURL=index.d.ts.map