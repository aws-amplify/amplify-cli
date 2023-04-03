"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.constructResourceMeta = exports.constructPartialNotificationsAppMeta = exports.addPartialNotificationsAppMeta = exports.getPinpointRegionMapping = exports.getDisabledChannelsFromAmplifyMeta = exports.getEnabledChannelsFromAppMeta = exports.isNotificationChannelEnabled = exports.checkMigratedFromMobileHubLegacy = exports.checkMigratedFromMobileHub = exports.removeNotificationsAppMeta = exports.getNotificationsAppMeta = exports.toggleNotificationsChannelAppMeta = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const plugin_client_api_analytics_1 = require("./plugin-client-api-analytics");
const notifications_backend_cfg_channel_api_1 = require("./notifications-backend-cfg-channel-api");
const toggleNotificationsChannelAppMeta = async (channelName, isEnabled, amplifyMeta, appName) => {
    const tmpAmplifyMeta = amplifyMeta;
    const notificationsAppMeta = await (0, exports.getNotificationsAppMeta)(tmpAmplifyMeta, appName);
    if (!notificationsAppMeta) {
        return tmpAmplifyMeta;
    }
    const channelOutput = notificationsAppMeta.output || {};
    const channelValue = channelOutput[channelName] || {};
    notificationsAppMeta.output = notificationsAppMeta.output || {};
    notificationsAppMeta.output[channelName] = {
        ...channelValue,
        Enabled: isEnabled,
        ApplicationId: channelOutput.Id,
        Name: channelOutput.Name,
    };
    if (!notificationsAppMeta.lastPushTimeStamp) {
        const analyticsLastPushTimeStamp = await (0, plugin_client_api_analytics_1.invokeGetLastPushTimeStamp)(tmpAmplifyMeta, notificationsAppMeta.ResourceName);
        if (analyticsLastPushTimeStamp) {
            notificationsAppMeta.lastPushTimeStamp = analyticsLastPushTimeStamp;
            notificationsAppMeta.lastPushDirHash =
                notificationsAppMeta.lastPushDirHash || oneAtATimeJenkinsHash(JSON.stringify(notificationsAppMeta));
        }
    }
    tmpAmplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][notificationsAppMeta.ResourceName] = notificationsAppMeta;
    return tmpAmplifyMeta;
};
exports.toggleNotificationsChannelAppMeta = toggleNotificationsChannelAppMeta;
const oneAtATimeJenkinsHash = (keyString) => {
    let hash = 0;
    for (let charIndex = 0; charIndex < keyString.length; ++charIndex) {
        hash += keyString.charCodeAt(charIndex);
        hash += hash << 10;
        hash ^= hash >> 6;
    }
    hash += hash << 3;
    hash ^= hash >> 11;
    return (((hash + (hash << 15)) & 4294967295) >>> 0).toString(16);
};
const PINPOINT_PROVIDER_NAME = 'awscloudformation';
const getNotificationsAppMeta = async (amplifyMeta, appName) => {
    const notificationResourceList = await getNotificationsAppListMeta(amplifyMeta, appName);
    return notificationResourceList.length > 0 ? notificationResourceList[0] : undefined;
};
exports.getNotificationsAppMeta = getNotificationsAppMeta;
const removeNotificationsAppMeta = async (context) => {
    const amplifyMeta = context.exeInfo.amplifyMeta || amplify_cli_core_1.stateManager.getMeta();
    if (amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS in amplifyMeta) {
        delete amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
    }
    context.exeInfo.amplifyMeta = amplifyMeta;
    return context;
};
exports.removeNotificationsAppMeta = removeNotificationsAppMeta;
const checkMigratedFromMobileHub = async (amplifyMeta) => {
    const notificationAppMeta = await (0, exports.getNotificationsAppMeta)(amplifyMeta);
    return !!(notificationAppMeta === null || notificationAppMeta === void 0 ? void 0 : notificationAppMeta.mobileHubMigrated);
};
exports.checkMigratedFromMobileHub = checkMigratedFromMobileHub;
const checkMigratedFromMobileHubLegacy = async (amplifyMeta) => {
    const tmpMeta = amplifyMeta || (await amplify_cli_core_1.stateManager.getMeta());
    const categoryMeta = tmpMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
    if (categoryMeta) {
        const services = Object.keys(categoryMeta);
        for (const service of services) {
            const serviceMeta = categoryMeta[service];
            if (serviceMeta.mobileHubMigrated === true) {
                return true;
            }
        }
    }
    return false;
};
exports.checkMigratedFromMobileHubLegacy = checkMigratedFromMobileHubLegacy;
const isNotificationChannelEnabled = (notificationsResourceMeta, channelName) => { var _a; return !!((_a = notificationsResourceMeta === null || notificationsResourceMeta === void 0 ? void 0 : notificationsResourceMeta.output[channelName]) === null || _a === void 0 ? void 0 : _a.Enabled); };
exports.isNotificationChannelEnabled = isNotificationChannelEnabled;
const getEnabledChannelsFromAppMeta = async (amplifyMeta) => {
    const tmpAmplifyMeta = amplifyMeta || amplify_cli_core_1.stateManager.getMeta();
    const availableChannels = (0, notifications_backend_cfg_channel_api_1.getAvailableChannels)();
    const notificationsMeta = await (0, exports.getNotificationsAppMeta)(tmpAmplifyMeta);
    return notificationsMeta ? availableChannels.filter((channel) => (0, exports.isNotificationChannelEnabled)(notificationsMeta, channel)) : [];
};
exports.getEnabledChannelsFromAppMeta = getEnabledChannelsFromAppMeta;
const getDisabledChannelsFromAmplifyMeta = async (amplifyMeta) => {
    const disabledChannelList = [];
    const availableChannels = (0, notifications_backend_cfg_channel_api_1.getAvailableChannels)();
    const enabledChannels = await (0, exports.getEnabledChannelsFromAppMeta)(amplifyMeta);
    availableChannels.forEach((channel) => {
        if (!enabledChannels.includes(channel)) {
            disabledChannelList.push(channel);
        }
    });
    return disabledChannelList;
};
exports.getDisabledChannelsFromAmplifyMeta = getDisabledChannelsFromAmplifyMeta;
const getPinpointRegionMapping = async (context) => {
    var _a;
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    const applicationRegion = amplify_cli_core_1.stateManager.getCurrentRegion(projectPath);
    if (!applicationRegion) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: `Invalid Region for project at ${projectPath}`,
        });
    }
    const providerPlugin = await (_a = context.amplify.getProviderPlugins(context)[PINPOINT_PROVIDER_NAME], Promise.resolve().then(() => __importStar(require(_a))));
    const regionMapping = providerPlugin.getPinpointRegionMapping();
    return applicationRegion in regionMapping ? regionMapping[applicationRegion] : undefined;
};
exports.getPinpointRegionMapping = getPinpointRegionMapping;
const addPartialNotificationsAppMeta = async (context, notificationResourceName) => {
    const updatedAmplifyMeta = await amplify_cli_core_1.stateManager.getMeta();
    const pinpointRegion = await (0, exports.getPinpointRegionMapping)(context);
    return (0, exports.constructPartialNotificationsAppMeta)(updatedAmplifyMeta, notificationResourceName, pinpointRegion);
};
exports.addPartialNotificationsAppMeta = addPartialNotificationsAppMeta;
const constructPartialNotificationsAppMeta = (amplifyMeta, resourceName, pinpointRegion) => {
    const envName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    const partialPinpointOutput = {
        Id: undefined,
        Region: pinpointRegion,
        Name: `${resourceName}-${envName}`,
    };
    return (0, exports.constructResourceMeta)(amplifyMeta, resourceName, partialPinpointOutput);
};
exports.constructPartialNotificationsAppMeta = constructPartialNotificationsAppMeta;
const constructResourceMeta = (amplifyMeta, resourceName, pinpointOutput) => {
    if (!amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS] || Object.keys(amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS]).length === 0) {
        amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS] = { [resourceName]: { output: {} } };
    }
    amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][resourceName] = {
        ...amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][resourceName],
        service: amplify_cli_core_1.AmplifySupportedService.PINPOINT,
        output: {
            ...amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][resourceName].output,
            ...pinpointOutput,
        },
        lastPushTimeStamp: new Date(),
    };
    return amplifyMeta;
};
exports.constructResourceMeta = constructResourceMeta;
const getNotificationsAppListMeta = async (amplifyMeta, appName) => {
    const tmpMeta = amplifyMeta || (await amplify_cli_core_1.stateManager.getMeta());
    const notificationsMeta = tmpMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
    const notificationsResourceList = [];
    if (notificationsMeta) {
        for (const resourceName of Object.keys(notificationsMeta)) {
            if (!appName || appName === resourceName) {
                const notificationsResourceMeta = notificationsMeta[resourceName];
                notificationsResourceList.push({
                    Id: notificationsResourceMeta.output.Id,
                    ResourceName: resourceName,
                    Name: notificationsResourceMeta.output.Name,
                    service: notificationsResourceMeta.service || amplify_cli_core_1.AmplifySupportedService.PINPOINT,
                    Region: notificationsResourceMeta.output.Region,
                    output: notificationsResourceMeta.output,
                    ...notificationsResourceMeta,
                });
            }
        }
    }
    return notificationsResourceList;
};
//# sourceMappingURL=notifications-amplify-meta-api.js.map