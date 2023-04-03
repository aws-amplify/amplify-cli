"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeAnalyticsMigrations = exports.invokeAnalyticsPinpointHasInAppMessagingPolicy = exports.invokeAnalyticsPush = exports.invokeGetLastPushTimeStamp = exports.invokeAnalyticsResourceToggleNotificationChannel = exports.invokeAnalyticsAPICreateResource = exports.invokeAnalyticsAPIGetResources = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const invokeAnalyticsAPIGetResources = async (context, resourceProviderServiceName) => (await context.amplify.invokePluginMethod(context, 'analytics', undefined, 'analyticsPluginAPIGetResources', [
    resourceProviderServiceName,
]));
exports.invokeAnalyticsAPIGetResources = invokeAnalyticsAPIGetResources;
const invokeAnalyticsAPICreateResource = async (context, resourceProviderServiceName) => (await context.amplify.invokePluginMethod(context, 'analytics', undefined, 'analyticsPluginAPICreateResource', [
    context,
    resourceProviderServiceName,
]));
exports.invokeAnalyticsAPICreateResource = invokeAnalyticsAPICreateResource;
const invokeAnalyticsResourceToggleNotificationChannel = async (context, resourceProviderServiceName, channel, enableChannel) => (await context.amplify.invokePluginMethod(context, 'analytics', resourceProviderServiceName, 'analyticsPluginAPIToggleNotificationChannel', [resourceProviderServiceName, channel, enableChannel]));
exports.invokeAnalyticsResourceToggleNotificationChannel = invokeAnalyticsResourceToggleNotificationChannel;
const invokeGetLastPushTimeStamp = async (amplifyMeta, analyticsResourceName) => amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS][analyticsResourceName].lastPushTimeStamp;
exports.invokeGetLastPushTimeStamp = invokeGetLastPushTimeStamp;
const invokeAnalyticsPush = async (context, analyticsResourceName) => (await context.amplify.invokePluginMethod(context, 'analytics', analyticsResourceName, 'analyticsPluginAPIPush', [
    context,
]));
exports.invokeAnalyticsPush = invokeAnalyticsPush;
const invokeAnalyticsPinpointHasInAppMessagingPolicy = async (context) => (await context.amplify.invokePluginMethod(context, 'analytics', undefined, 'analyticsPluginAPIPinpointHasInAppMessagingPolicy', [
    context,
]));
exports.invokeAnalyticsPinpointHasInAppMessagingPolicy = invokeAnalyticsPinpointHasInAppMessagingPolicy;
const invokeAnalyticsMigrations = async (context) => context.amplify.invokePluginMethod(context, 'analytics', undefined, 'analyticsPluginAPIMigrations', [context]);
exports.invokeAnalyticsMigrations = invokeAnalyticsMigrations;
//# sourceMappingURL=plugin-client-api-analytics.js.map