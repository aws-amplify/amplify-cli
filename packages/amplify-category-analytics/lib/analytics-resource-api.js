"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsPluginAPIMigrations = exports.analyticsPluginAPIPinpointHasInAppMessagingPolicy = exports.analyticsPluginAPIPostPush = exports.analyticsPushYes = exports.analyticsPluginAPIPush = exports.analyticsPluginAPIToggleNotificationChannel = exports.analyticsPluginAPICreateResource = exports.analyticsPluginAPIGetResources = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const index_1 = require("./provider-utils/awscloudformation/index");
const analytics_1 = require("./commands/analytics");
const plugin_client_api_auth_1 = require("./plugin-client-api-auth");
const plugin_client_api_notifications_1 = require("./plugin-client-api-notifications");
const pinpoint_helper_1 = require("./utils/pinpoint-helper");
const analytics_helper_1 = require("./utils/analytics-helper");
const migrations_1 = require("./migrations");
const analyticsPluginAPIGetResources = (resourceProviderServiceName, context) => (0, analytics_helper_1.getAnalyticsResources)(context, resourceProviderServiceName);
exports.analyticsPluginAPIGetResources = analyticsPluginAPIGetResources;
const analyticsPluginAPICreateResource = async (context, resourceProviderServiceName) => {
    const resources = (0, exports.analyticsPluginAPIGetResources)(resourceProviderServiceName);
    if (resources.length > 0) {
        return resources[0];
    }
    const options = {
        service: resourceProviderServiceName,
        providerPlugin: 'awscloudformation',
    };
    const resourceName = await (0, index_1.addResource)(context, amplify_cli_core_1.AmplifyCategories.ANALYTICS, resourceProviderServiceName);
    context.amplify.updateamplifyMetaAfterResourceAdd(amplify_cli_core_1.AmplifyCategories.ANALYTICS, resourceName, options);
    const output = {
        category: amplify_cli_core_1.AmplifyCategories.ANALYTICS,
        resourceName,
        service: resourceProviderServiceName,
    };
    return output;
};
exports.analyticsPluginAPICreateResource = analyticsPluginAPICreateResource;
const analyticsPluginAPIToggleNotificationChannel = async (resourceProviderServiceName, channel, enableChannel) => {
    const response = {
        pluginName: amplify_cli_core_1.AmplifyCategories.ANALYTICS,
        resourceProviderServiceName,
        capability: amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS,
        subCapability: channel,
        status: false,
    };
    if (!isSupportAnalytics(resourceProviderServiceName)) {
        response.status = false;
        response.errorCode = amplify_cli_core_1.PluginAPIError.E_NO_SVC_PROVIDER;
        response.reasonMsg = `${resourceProviderServiceName} is not a provider for ${amplify_cli_core_1.AmplifyCategories.ANALYTICS} category`;
        return response;
    }
    if (!isSupportNotifications(resourceProviderServiceName)) {
        response.status = false;
        response.errorCode = amplify_cli_core_1.PluginAPIError.E_SVC_PROVIDER_NO_CAPABILITY;
        response.reasonMsg = `${amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS} not supported on ${amplify_cli_core_1.AmplifyCategories.ANALYTICS} provider ${resourceProviderServiceName}`;
        return response;
    }
    const resources = (0, exports.analyticsPluginAPIGetResources)(resourceProviderServiceName);
    if (!resources) {
        response.status = false;
        response.errorCode = amplify_cli_core_1.PluginAPIError.E_NO_RESPONSE;
        response.reasonMsg = `No Resources Found for ${amplify_cli_core_1.AmplifyCategories.ANALYTICS} category`;
        return response;
    }
    const pinpointResource = resources[0];
    if (enableChannel) {
        await pinpointAPIEnableNotificationChannel(pinpointResource, channel);
    }
    else {
        await pinpointAPIDisableNotificationChannel(pinpointResource, channel);
    }
    response.status = true;
    return response;
};
exports.analyticsPluginAPIToggleNotificationChannel = analyticsPluginAPIToggleNotificationChannel;
const analyticsPluginAPIPush = async (context, resourceProviderServiceName) => {
    const pushResponse = {
        pluginName: amplify_cli_core_1.AmplifyCategories.ANALYTICS,
        resourceProviderServiceName,
        capability: amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS,
        status: true,
    };
    const resources = (0, exports.analyticsPluginAPIGetResources)(resourceProviderServiceName, context);
    if (!resources || resources.length === 0) {
        pushResponse.status = false;
        pushResponse.errorCode = amplify_cli_core_1.PluginAPIError.E_NO_RESPONSE;
        pushResponse.reasonMsg = `No Resources of ${resourceProviderServiceName} found for ${amplify_cli_core_1.AmplifyCategories.ANALYTICS} category`;
    }
    else {
        try {
            await (0, plugin_client_api_auth_1.invokeAuthPush)(context);
            await (0, exports.analyticsPushYes)(context);
        }
        catch (err) {
            pushResponse.status = false;
            pushResponse.errorCode = amplify_cli_core_1.PluginAPIError.E_PUSH_FAILED;
            pushResponse.reasonMsg = err.message;
        }
    }
    return pushResponse;
};
exports.analyticsPluginAPIPush = analyticsPluginAPIPush;
const analyticsPushYes = async (context) => {
    var _a, _b;
    const exeInfoClone = { ...context === null || context === void 0 ? void 0 : context.exeInfo };
    const parametersClone = { ...context === null || context === void 0 ? void 0 : context.parameters };
    try {
        (_a = context.exeInfo) !== null && _a !== void 0 ? _a : (context.exeInfo = { inputParams: {}, localEnvInfo: {} });
        context.exeInfo.inputParams = context.exeInfo.inputParams || {};
        context.exeInfo.inputParams.yes = true;
        context.parameters = context.parameters || {};
        context.parameters.options = (_b = context.parameters.options) !== null && _b !== void 0 ? _b : {};
        context.parameters.options.yes = true;
        context.parameters.first = undefined;
        await (0, analytics_1.analyticsPush)(context);
    }
    finally {
        context.exeInfo = exeInfoClone;
        context.parameters = parametersClone;
    }
};
exports.analyticsPushYes = analyticsPushYes;
const analyticsPluginAPIPostPush = async (context) => {
    var _a;
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    let pinpointNotificationsMeta;
    if ((amplifyMeta === null || amplifyMeta === void 0 ? void 0 : amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS]) &&
        Object.keys(amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS]).length > 0 &&
        amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS] &&
        Object.keys(amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS]).length > 0) {
        const analyticsResourceList = (0, exports.analyticsPluginAPIGetResources)(amplify_cli_core_1.AmplifySupportedService.PINPOINT);
        const notificationsResourceName = Object.keys(amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS])[0];
        const analyticsResource = analyticsResourceList.find((p) => p.resourceName === notificationsResourceName);
        if ((_a = analyticsResource === null || analyticsResource === void 0 ? void 0 : analyticsResource.output) === null || _a === void 0 ? void 0 : _a.Id) {
            pinpointNotificationsMeta = amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][analyticsResource.resourceName];
            pinpointNotificationsMeta.Name = pinpointNotificationsMeta.Name || analyticsResource.output.appName;
            pinpointNotificationsMeta.Id = analyticsResource.output.Id;
            pinpointNotificationsMeta.Region = analyticsResource.output.Region;
            pinpointNotificationsMeta.output = pinpointNotificationsMeta.output || {};
            pinpointNotificationsMeta.output.Id = analyticsResource.output.Id;
            pinpointNotificationsMeta.output.regulatedResourceName = analyticsResource.resourceName;
            pinpointNotificationsMeta.output.region = analyticsResource.output.Region;
            amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][analyticsResource.resourceName] = pinpointNotificationsMeta;
            const channelNames = await (0, plugin_client_api_notifications_1.invokeNotificationsAPIGetAvailableChannelNames)(context);
            for (const channelName of channelNames) {
                if (pinpointNotificationsMeta.output[channelName]) {
                    pinpointNotificationsMeta.output[channelName].ApplicationId = analyticsResource.output.Id;
                    pinpointNotificationsMeta.output[channelName].Name = analyticsResource.output.appName;
                }
            }
            amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][analyticsResource.resourceName] = pinpointNotificationsMeta;
        }
    }
    if (amplifyMeta.analytics && context.exeInfo.amplifyMeta) {
        context.exeInfo.amplifyMeta.analytics = Object.assign(context.exeInfo.amplifyMeta.analytics, amplifyMeta.analytics);
    }
    if (amplifyMeta.notifications && context.exeInfo.amplifyMeta) {
        context.exeInfo.amplifyMeta.notifications = Object.assign(context.exeInfo.amplifyMeta.notifications, amplifyMeta.notifications);
    }
    if (amplifyMeta) {
        amplify_cli_core_1.stateManager.setMeta(undefined, amplifyMeta);
    }
    if (pinpointNotificationsMeta) {
        await writeNotificationsTeamProviderInfo(pinpointNotificationsMeta);
    }
    await context.amplify.onCategoryOutputsChange(context, undefined, undefined);
    return context;
};
exports.analyticsPluginAPIPostPush = analyticsPluginAPIPostPush;
const writeNotificationsTeamProviderInfo = async (pinpointMeta) => {
    if (!pinpointMeta) {
        return;
    }
    const envParamManager = (0, amplify_environment_parameters_1.getEnvParamManager)();
    const params = {
        Name: pinpointMeta.Name,
        Id: pinpointMeta.Id,
        Region: pinpointMeta.Region,
    };
    [amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS, amplify_cli_core_1.AmplifyCategories.ANALYTICS]
        .map((category) => envParamManager.getResourceParamManager(category, amplify_cli_core_1.AmplifySupportedService.PINPOINT))
        .forEach((resourceParamManager) => {
        resourceParamManager.setAllParams(params);
    });
};
const buildPolicyName = (channel, pinpointPolicyName) => {
    const shortId = pinpointPolicyName.split('pinpointPolicy')[1];
    return `pinpoint${channel}PolicyName${shortId}`;
};
const isSupportNotifications = (resourceProviderName) => resourceProviderName === amplify_cli_core_1.AmplifySupportedService.PINPOINT;
const isSupportAnalytics = (resourceProviderName) => resourceProviderName === amplify_cli_core_1.AmplifySupportedService.PINPOINT || resourceProviderName === amplify_cli_core_1.AmplifySupportedService.KINESIS;
const pinpointAPIEnableNotificationChannel = (pinpointResource, notificationChannel) => {
    const pinpointResourceName = pinpointResource.resourceName;
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    const pinPointCFNInputParams = amplify_cli_core_1.stateManager.getResourceParametersJson(projectPath, amplify_cli_core_1.AmplifyCategories.ANALYTICS, pinpointResourceName);
    const uniqueChannelPolicyName = buildPolicyName(notificationChannel, pinPointCFNInputParams.pinpointPolicyName);
    switch (notificationChannel) {
        case amplify_cli_core_1.NotificationChannels.IN_APP_MSG: {
            pinPointCFNInputParams[`pinpoint${notificationChannel}PolicyName`] = uniqueChannelPolicyName;
            amplify_cli_core_1.stateManager.setResourceParametersJson(projectPath, amplify_cli_core_1.AmplifyCategories.ANALYTICS, pinpointResourceName, pinPointCFNInputParams);
            break;
        }
        default: {
            throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
                message: `Channel ${notificationChannel} is not supported on Analytics resource`,
                resolution: 'Use one of the supported channels',
            });
        }
    }
    return pinPointCFNInputParams;
};
const pinpointAPIDisableNotificationChannel = (pinpointResource, notificationChannel) => {
    const pinpointResourceName = pinpointResource.resourceName;
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    const pinPointCFNInputParams = amplify_cli_core_1.stateManager.getResourceParametersJson(projectPath, amplify_cli_core_1.AmplifyCategories.ANALYTICS, pinpointResourceName);
    switch (notificationChannel) {
        case amplify_cli_core_1.NotificationChannels.IN_APP_MSG: {
            delete pinPointCFNInputParams[`pinpoint${notificationChannel}PolicyName`];
            amplify_cli_core_1.stateManager.setResourceParametersJson(projectPath, amplify_cli_core_1.AmplifyCategories.ANALYTICS, pinpointResourceName, pinPointCFNInputParams);
            break;
        }
        default: {
            throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
                message: `Channel ${notificationChannel} is not supported on Analytics resource`,
                resolution: 'Use one of the supported channels',
            });
        }
    }
    return pinPointCFNInputParams;
};
const analyticsPluginAPIPinpointHasInAppMessagingPolicy = async (context) => (0, pinpoint_helper_1.pinpointHasInAppMessagingPolicy)(context);
exports.analyticsPluginAPIPinpointHasInAppMessagingPolicy = analyticsPluginAPIPinpointHasInAppMessagingPolicy;
const analyticsPluginAPIMigrations = (context) => (0, migrations_1.analyticsMigrations)(context);
exports.analyticsPluginAPIMigrations = analyticsPluginAPIMigrations;
//# sourceMappingURL=analytics-resource-api.js.map