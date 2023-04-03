"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeData = void 0;
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const channel_types_1 = require("./channel-types");
const notifications_amplify_meta_api_1 = require("./notifications-amplify-meta-api");
const notifications_backend_cfg_api_1 = require("./notifications-backend-cfg-api");
const notifications_api_1 = require("./notifications-api");
const writeTeamProviderInfo = (pinpointMeta) => {
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
const updateBackendConfig = (pinpointMeta, backendConfig) => {
    if (backendConfig) {
        backendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS] = backendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS] || {};
        const resources = Object.keys(backendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS]);
        for (const resource of resources) {
            const serviceMeta = backendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][resource];
            if (serviceMeta.service === amplify_cli_core_1.AmplifySupportedService.PINPOINT) {
                delete backendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][resource];
            }
        }
        if (pinpointMeta) {
            backendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][pinpointMeta.serviceName] = {
                service: pinpointMeta.service,
                channels: pinpointMeta.channels,
            };
        }
        return backendConfig;
    }
    return undefined;
};
const writeData = async (context, channelAPIResponse) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!channelAPIResponse || channelAPIResponse.deploymentType === channel_types_1.ChannelConfigDeploymentType.INLINE) {
        if (channelAPIResponse) {
            await (0, notifications_api_1.updateChannelAPIResponse)(context, channelAPIResponse);
        }
        const analyticsMeta = context.exeInfo.amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS];
        const categoryMeta = context.exeInfo.amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
        const notificationsServiceMeta = await (0, notifications_amplify_meta_api_1.getNotificationsAppMeta)(context.exeInfo.amplifyMeta);
        const enabledChannels = await (0, notifications_amplify_meta_api_1.getEnabledChannelsFromAppMeta)(context.exeInfo.amplifyMeta);
        let pinpointMeta;
        if (notificationsServiceMeta) {
            const applicationId = notificationsServiceMeta.Id || ((_b = (_a = analyticsMeta[notificationsServiceMeta.ResourceName]) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.Id);
            const lastPushTimeStamp = notificationsServiceMeta.lastPushTimeStamp || ((_c = analyticsMeta[notificationsServiceMeta.ResourceName]) === null || _c === void 0 ? void 0 : _c.lastPushTimeStamp);
            const region = notificationsServiceMeta.Region || ((_e = (_d = analyticsMeta[notificationsServiceMeta.ResourceName]) === null || _d === void 0 ? void 0 : _d.output) === null || _e === void 0 ? void 0 : _e.Region);
            pinpointMeta = {
                serviceName: notificationsServiceMeta.ResourceName,
                service: notificationsServiceMeta.service,
                channels: enabledChannels,
                Name: notificationsServiceMeta.output.Name,
                Id: applicationId,
                Region: region,
                lastPushTimeStamp,
            };
        }
        await (0, amplify_environment_parameters_1.ensureEnvParamManager)();
        writeTeamProviderInfo(pinpointMeta);
        amplify_cli_core_1.stateManager.setBackendConfig(undefined, updateBackendConfig(pinpointMeta, amplify_cli_core_1.stateManager.getBackendConfig()));
        amplify_cli_core_1.stateManager.setMeta(undefined, updateNotificationsMeta(amplify_cli_core_1.stateManager.getMeta(), categoryMeta));
        amplify_cli_core_1.stateManager.setCurrentBackendConfig(undefined, updateBackendConfig(pinpointMeta, amplify_cli_core_1.stateManager.getCurrentBackendConfig()));
        amplify_cli_core_1.stateManager.setCurrentMeta(undefined, updateNotificationsMeta(amplify_cli_core_1.stateManager.getCurrentMeta(), categoryMeta));
        await context.amplify.storeCurrentCloudBackend(context);
    }
    else {
        await (0, notifications_api_1.updateChannelAPIResponse)(context, channelAPIResponse);
        const analyticsMeta = context.exeInfo.amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS];
        const categoryMeta = context.exeInfo.amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
        const notificationsServiceMeta = await (0, notifications_amplify_meta_api_1.getNotificationsAppMeta)(context.exeInfo.amplifyMeta);
        const enabledChannels = await (0, notifications_amplify_meta_api_1.getEnabledChannelsFromAppMeta)(context.exeInfo.amplifyMeta);
        if (!notificationsServiceMeta) {
            throw new amplify_cli_core_1.AmplifyFault('ConfigurationFault', {
                message: 'Failed to store notifications meta. Amplify Meta not found for Notifications.',
            });
        }
        const applicationId = notificationsServiceMeta.Id || ((_g = (_f = analyticsMeta[notificationsServiceMeta === null || notificationsServiceMeta === void 0 ? void 0 : notificationsServiceMeta.ResourceName]) === null || _f === void 0 ? void 0 : _f.output) === null || _g === void 0 ? void 0 : _g.Id);
        const lastPushTimeStamp = notificationsServiceMeta.lastPushTimeStamp || ((_h = analyticsMeta[notificationsServiceMeta.ResourceName]) === null || _h === void 0 ? void 0 : _h.lastPushTimeStamp);
        const pinpointConfig = await (0, notifications_backend_cfg_api_1.getNotificationsAppConfig)(context.exeInfo.backendConfig);
        const pinpointMeta = {
            serviceName: notificationsServiceMeta.ResourceName,
            service: notificationsServiceMeta.service,
            channels: enabledChannels,
            Name: notificationsServiceMeta.output.Name,
            Id: applicationId,
            Region: notificationsServiceMeta.Region,
            lastPushTimeStamp,
        };
        await (0, notifications_api_1.updateChannelAPIResponse)(context, channelAPIResponse);
        writeTeamProviderInfo(pinpointMeta);
        if (pinpointConfig) {
            amplify_cli_core_1.stateManager.setBackendConfig(undefined, updateBackendConfig(pinpointConfig, amplify_cli_core_1.stateManager.getBackendConfig()));
        }
        amplify_cli_core_1.stateManager.setMeta(undefined, updateNotificationsMeta(amplify_cli_core_1.stateManager.getMeta(), categoryMeta));
    }
    await context.amplify.onCategoryOutputsChange(context, undefined, undefined);
};
exports.writeData = writeData;
const updateNotificationsMeta = (meta, notificationsMeta) => {
    meta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS] = notificationsMeta;
    return meta;
};
//# sourceMappingURL=multi-env-manager-utils.js.map