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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = exports.checkAndCreatePinpointApp = exports.deletePinpointAppForEnv = exports.initEnv = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const authHelper = __importStar(require("./auth-helper"));
const pinpoint_helper_1 = require("./pinpoint-helper");
const notificationManager = __importStar(require("./notifications-manager"));
const notifications_api_1 = require("./notifications-api");
const pinpoint_name_1 = require("./pinpoint-name");
const multi_env_manager_utils_1 = require("./multi-env-manager-utils");
const display_utils_1 = require("./display-utils");
const notifications_backend_cfg_channel_api_1 = require("./notifications-backend-cfg-channel-api");
const initEnv = async (context) => {
    var _a;
    const pinpointNotificationsMeta = await constructPinpointNotificationsMeta(context);
    if (pinpointNotificationsMeta) {
        const channelAPIResponseList = await pushChanges(context, pinpointNotificationsMeta);
        if (channelAPIResponseList && channelAPIResponseList.length > 0) {
            for (const channelAPIResponse of channelAPIResponseList) {
                await (0, multi_env_manager_utils_1.writeData)(context, channelAPIResponse);
            }
        }
        else {
            if ((_a = pinpointNotificationsMeta.output) === null || _a === void 0 ? void 0 : _a.Id) {
                const { envName } = context.exeInfo.localEnvInfo;
                const regulatedResourceName = pinpoint_name_1.PinpointName.extractResourceName(pinpointNotificationsMeta.Name, envName);
                context.exeInfo.amplifyMeta.notifications = {
                    [regulatedResourceName]: {
                        Id: pinpointNotificationsMeta.output.Id,
                        ResourceName: regulatedResourceName,
                        Name: pinpointNotificationsMeta.Name,
                        Region: pinpointNotificationsMeta.Region,
                        service: pinpointNotificationsMeta.service,
                        output: pinpointNotificationsMeta.output,
                        lastPushTimeStamp: pinpointNotificationsMeta.lastPushTimeStamp,
                    },
                };
                const availableChannels = (0, notifications_backend_cfg_channel_api_1.getAvailableChannels)();
                const enabledChannels = availableChannels.filter((channelName) => channelName in pinpointNotificationsMeta.output);
                context.exeInfo.backendConfig.notifications = context.exeInfo.backendConfig.notifications || {};
                context.exeInfo.backendConfig.notifications = {
                    [regulatedResourceName]: {
                        service: pinpointNotificationsMeta.service,
                        channels: enabledChannels,
                    },
                };
            }
            await (0, multi_env_manager_utils_1.writeData)(context, undefined);
        }
    }
    return pinpointNotificationsMeta;
};
exports.initEnv = initEnv;
const getAnalyticsResourcesFromMeta = (amplifyMeta, supportedServiceName) => {
    const resourceList = [];
    if (amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS]) {
        const categoryResources = amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS];
        Object.keys(categoryResources).forEach((resource) => {
            var _a, _b, _c, _d, _e;
            if (!supportedServiceName || categoryResources[resource].service === supportedServiceName) {
                resourceList.push({
                    category: amplify_cli_core_1.AmplifyCategories.ANALYTICS,
                    resourceName: resource,
                    service: categoryResources[resource].service,
                    region: (_b = (_a = categoryResources[resource]) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.Region,
                    id: (_d = (_c = categoryResources[resource]) === null || _c === void 0 ? void 0 : _c.output) === null || _d === void 0 ? void 0 : _d.Id,
                    output: (_e = categoryResources[resource]) === null || _e === void 0 ? void 0 : _e.output,
                });
            }
        });
    }
    return resourceList;
};
const getPinpointAppFromAnalyticsMeta = (amplifyMeta) => {
    const resources = getAnalyticsResourcesFromMeta(amplifyMeta, amplify_cli_core_1.AmplifySupportedService.PINPOINT);
    if (resources.length <= 0) {
        return undefined;
    }
    const pinpointAppMeta = (0, pinpoint_helper_1.getPinpointAppFromAnalyticsOutput)(resources[0]);
    return pinpointAppMeta;
};
const constructPinpointNotificationsMeta = async (context) => {
    var _a, _b, _c, _d, _e;
    let pinpointApp;
    let serviceBackendConfig;
    let pinpointNotificationsMeta;
    const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && ((_a = context.input.subCommands) === null || _a === void 0 ? void 0 : _a[0]) === 'pull');
    const currentAmplifyMeta = amplify_cli_core_1.stateManager.getCurrentMeta(undefined, {
        throwIfNotExist: false,
    });
    if (isPulling && currentAmplifyMeta) {
        const currentNotificationsMeta = currentAmplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
        if (currentNotificationsMeta && Object.keys(currentNotificationsMeta).length > 0) {
            const pinpointResource = lodash_1.default.get(currentNotificationsMeta, Object.keys(currentNotificationsMeta)[0], undefined);
            if (!pinpointResource.output.Id) {
                const analyticsPinpointApp = getPinpointAppFromAnalyticsMeta(currentAmplifyMeta);
                if (analyticsPinpointApp) {
                    pinpointResource.output.Id = analyticsPinpointApp.Id;
                    pinpointResource.output.Region = analyticsPinpointApp.Region;
                    pinpointResource.output.Name = analyticsPinpointApp.Name;
                    pinpointResource.ResourceName = analyticsPinpointApp.regulatedResourceName;
                }
            }
            if (!pinpointResource.output.Id) {
                throw new amplify_cli_core_1.AmplifyError('ResourceNotReadyError', {
                    message: 'Pinpoint resource ID not found.',
                    resolution: 'Run "amplify add analytics" to create a new Pinpoint resource.',
                });
            }
            pinpointApp = {
                Id: pinpointResource.output.Id,
            };
            pinpointApp.Name = pinpointResource.output.Name || pinpointResource.output.appName;
            pinpointApp.Region = pinpointResource.output.Region;
            pinpointApp.lastPushTimeStamp = pinpointResource.lastPushTimeStamp;
        }
    }
    const { teamProviderInfo, localEnvInfo, amplifyMeta, backendConfig } = context.exeInfo;
    const { envName } = localEnvInfo;
    if ((_e = (_d = (_c = (_b = teamProviderInfo === null || teamProviderInfo === void 0 ? void 0 : teamProviderInfo[envName]) === null || _b === void 0 ? void 0 : _b.categories) === null || _c === void 0 ? void 0 : _c[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS]) === null || _d === void 0 ? void 0 : _d[amplify_cli_core_1.AmplifySupportedService.PINPOINT]) === null || _e === void 0 ? void 0 : _e.Id) {
        pinpointApp = teamProviderInfo[envName].categories[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][amplify_cli_core_1.AmplifySupportedService.PINPOINT];
    }
    let isMobileHubMigrated = false;
    if (!pinpointApp) {
        const analyticsMeta = amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS];
        if (analyticsMeta) {
            for (const resourceName of Object.keys(analyticsMeta)) {
                const resource = analyticsMeta[resourceName];
                if (resource.mobileHubMigrated === true) {
                    isMobileHubMigrated = true;
                    break;
                }
            }
        }
        if (!isMobileHubMigrated) {
            pinpointApp = (0, pinpoint_helper_1.scanCategoryMetaForPinpoint)(analyticsMeta, undefined);
        }
    }
    if (!isMobileHubMigrated) {
        if (backendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS]) {
            const categoryConfig = backendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
            const resources = Object.keys(categoryConfig);
            for (const resource of resources) {
                serviceBackendConfig = categoryConfig[resource];
                if (serviceBackendConfig.service === amplify_cli_core_1.AmplifySupportedService.PINPOINT) {
                    serviceBackendConfig.resourceName = resource;
                    break;
                }
            }
        }
        if (pinpointApp && (!isPulling || (isPulling && currentAmplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS]))) {
            await notificationManager.pullAllChannels(context, pinpointApp);
            pinpointNotificationsMeta = {
                Name: pinpointApp.Name,
                service: amplify_cli_core_1.AmplifySupportedService.PINPOINT,
                output: pinpointApp,
                lastPushTimeStamp: pinpointApp.lastPushTimeStamp,
            };
            delete pinpointNotificationsMeta.output.lastPushTimeStamp;
        }
        if (serviceBackendConfig) {
            if (pinpointNotificationsMeta) {
                pinpointNotificationsMeta.channels = serviceBackendConfig.channels;
            }
            else {
                return (0, notifications_api_1.generateMetaFromConfig)(envName, serviceBackendConfig);
            }
        }
        return pinpointNotificationsMeta;
    }
    return pinpointNotificationsMeta;
};
const deletePinpointAppForEnv = async (context, envName) => {
    var _a, _b, _c;
    let pinpointApp;
    const teamProviderInfo = context.amplify.getEnvDetails();
    if ((_c = (_b = (_a = teamProviderInfo === null || teamProviderInfo === void 0 ? void 0 : teamProviderInfo[envName]) === null || _a === void 0 ? void 0 : _a.categories) === null || _b === void 0 ? void 0 : _b[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS]) === null || _c === void 0 ? void 0 : _c[amplify_cli_core_1.AmplifySupportedService.PINPOINT]) {
        pinpointApp = teamProviderInfo[envName].categories[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][amplify_cli_core_1.AmplifySupportedService.PINPOINT];
    }
    if (pinpointApp) {
        const params = {
            ApplicationId: pinpointApp.Id,
        };
        const pinpointClient = await (0, pinpoint_helper_1.getPinpointClient)(context, 'delete', envName);
        await authHelper.deleteRolePolicy(context);
        return pinpointClient
            .deleteApp(params)
            .promise()
            .then(() => {
            amplify_prompts_1.printer.success(`Successfully deleted Pinpoint project: ${pinpointApp.Id}`);
        })
            .catch((err) => {
            if (err.code === 'NotFoundException') {
                amplify_prompts_1.printer.warn(`${pinpointApp.Id}: not found`);
            }
            else {
                amplify_prompts_1.printer.error(`Failed to delete Pinpoint project: ${pinpointApp.Id}`);
                throw err;
            }
        });
    }
    return undefined;
};
exports.deletePinpointAppForEnv = deletePinpointAppForEnv;
const buildPinpointInputParameters = (context) => {
    const { backendConfig } = context.exeInfo;
    if (!backendConfig) {
        return buildPinpointInputParametersFromAmplifyMeta(context);
    }
    return buildPinpointInputParametersFromBackendConfig(context);
};
const getEnabledDisabledChannelsFromConfigAndMeta = (pinpointInputParams, pinpointNotificationsMeta) => {
    const channelsToEnable = [];
    const channelsToDisable = [];
    const availableChannels = (0, notifications_backend_cfg_channel_api_1.getAvailableChannels)();
    availableChannels.forEach((channel) => {
        var _a, _b, _c;
        let isCurrentlyEnabled = false;
        let needToBeEnabled = false;
        if (((_a = pinpointNotificationsMeta.output) === null || _a === void 0 ? void 0 : _a.Id) && ((_b = pinpointNotificationsMeta.output[channel]) === null || _b === void 0 ? void 0 : _b.Enabled)) {
            isCurrentlyEnabled = true;
        }
        if ((_c = pinpointNotificationsMeta.channels) === null || _c === void 0 ? void 0 : _c.includes(channel)) {
            needToBeEnabled = true;
        }
        if ((pinpointInputParams === null || pinpointInputParams === void 0 ? void 0 : pinpointInputParams[channel]) && Object.prototype.hasOwnProperty.call(pinpointInputParams[channel], 'Enabled')) {
            needToBeEnabled = pinpointInputParams[channel].Enabled;
        }
        if (isCurrentlyEnabled && !needToBeEnabled) {
            channelsToDisable.push(channel);
        }
        else if (!isCurrentlyEnabled && needToBeEnabled) {
            channelsToEnable.push(channel);
        }
    });
    return { channelsToEnable, channelsToDisable };
};
const checkAndCreatePinpointApp = async (context, channelName, pinpointAppStatus) => {
    let updatedPinpointAppStatus = pinpointAppStatus;
    if ((0, pinpoint_helper_1.isPinpointDeploymentRequired)(channelName, pinpointAppStatus)) {
        await (0, display_utils_1.viewShowInlineModeInstructionsStart)(channelName);
        try {
            updatedPinpointAppStatus = await (0, pinpoint_helper_1.pushAuthAndAnalyticsPinpointResources)(context, pinpointAppStatus);
            updatedPinpointAppStatus = await (0, pinpoint_helper_1.ensurePinpointApp)(context, updatedPinpointAppStatus);
            await (0, display_utils_1.viewShowInlineModeInstructionsStop)(channelName);
        }
        catch (err) {
            await (0, display_utils_1.viewShowInlineModeInstructionsFail)(channelName, err);
            throw new amplify_cli_core_1.AmplifyError('DeploymentError', {
                message: 'Failed to deploy Auth and Pinpoint resources.',
                resolution: 'Deploy the Auth and Pinpoint resources manually.',
            }, err);
        }
    }
    return updatedPinpointAppStatus;
};
exports.checkAndCreatePinpointApp = checkAndCreatePinpointApp;
const pushChanges = async (context, pinpointNotificationsMeta) => {
    var _a, _b, _c, _d;
    let pinpointInputParams;
    if ((_d = (_c = (_b = (_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.inputParams) === null || _b === void 0 ? void 0 : _b.categories) === null || _c === void 0 ? void 0 : _c[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS]) === null || _d === void 0 ? void 0 : _d[amplify_cli_core_1.AmplifySupportedService.PINPOINT]) {
        pinpointInputParams = context.exeInfo.inputParams.categories[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][amplify_cli_core_1.AmplifySupportedService.PINPOINT];
        context.exeInfo.pinpointInputParams = pinpointInputParams;
    }
    const pinpointAppStatus = await (0, pinpoint_helper_1.getPinpointAppStatus)(context, context.exeInfo.amplifyMeta, pinpointNotificationsMeta, context.exeInfo.localEnvInfo.envName);
    await (0, pinpoint_helper_1.ensurePinpointApp)(context, pinpointNotificationsMeta, pinpointAppStatus, context.exeInfo.localEnvInfo.envName);
    const results = [];
    if (!pinpointInputParams && context.exeInfo.amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS]) {
        pinpointInputParams = buildPinpointInputParameters(context);
    }
    const { channelsToEnable, channelsToDisable } = getEnabledDisabledChannelsFromConfigAndMeta(pinpointInputParams, pinpointNotificationsMeta);
    for (const channel of channelsToEnable) {
        await (0, exports.checkAndCreatePinpointApp)(context, channel, pinpointAppStatus);
        results.push(await notificationManager.enableChannel(context, channel));
    }
    for (const channel of channelsToDisable) {
        await (0, exports.checkAndCreatePinpointApp)(context, channel, pinpointAppStatus);
        results.push(await notificationManager.disableChannel(context, channel));
    }
    return results;
};
const migrate = async (context) => {
    const migrationInfo = extractMigrationInfo(context);
    fillBackendConfig(context, migrationInfo);
    fillTeamProviderInfo(context, migrationInfo);
};
exports.migrate = migrate;
const extractMigrationInfo = (context) => {
    var _a;
    let migrationInfo;
    const { amplifyMeta, localEnvInfo } = context.migrationInfo;
    if (amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS]) {
        const categoryMeta = amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
        const resources = Object.keys(categoryMeta);
        for (const service of resources) {
            const serviceMeta = amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][service];
            if (serviceMeta.service === amplify_cli_core_1.AmplifySupportedService.PINPOINT) {
                migrationInfo = {};
                migrationInfo.envName = localEnvInfo.envName;
                migrationInfo.serviceName = service;
                migrationInfo.service = serviceMeta.service;
                migrationInfo.output = serviceMeta.output;
                break;
            }
        }
    }
    if ((_a = migrationInfo === null || migrationInfo === void 0 ? void 0 : migrationInfo.output) === null || _a === void 0 ? void 0 : _a.Id) {
        migrationInfo.Id = migrationInfo.output.Id;
        migrationInfo.Name = migrationInfo.output.Name;
        migrationInfo.Region = migrationInfo.output.Region;
        migrationInfo.channels = [];
        const availableChannels = (0, notifications_backend_cfg_channel_api_1.getAvailableChannels)();
        availableChannels.forEach((channel) => {
            var _a;
            if ((_a = migrationInfo.output[channel]) === null || _a === void 0 ? void 0 : _a.Enabled) {
                migrationInfo.channels.push(channel);
            }
        });
    }
    return migrationInfo;
};
const fillBackendConfig = (context, migrationInfo) => {
    if (migrationInfo) {
        const backendConfig = {};
        backendConfig[migrationInfo.serviceName] = {
            service: migrationInfo.service,
            channels: migrationInfo.channels,
        };
        Object.assign(context.migrationInfo.backendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS], backendConfig);
    }
};
const fillTeamProviderInfo = (context, migrationInfo) => {
    if (migrationInfo === null || migrationInfo === void 0 ? void 0 : migrationInfo.Id) {
        const categoryTeamInfo = {};
        categoryTeamInfo[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS] = {};
        categoryTeamInfo[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][amplify_cli_core_1.AmplifySupportedService.PINPOINT] = {
            Name: migrationInfo.Name,
            Id: migrationInfo.Id,
            Region: migrationInfo.Region,
        };
        const { teamProviderInfo } = context.migrationInfo;
        teamProviderInfo[migrationInfo.envName] = teamProviderInfo[migrationInfo.envName] || {};
        teamProviderInfo[migrationInfo.envName].categories = teamProviderInfo[migrationInfo.envName].categories || {};
        Object.assign(teamProviderInfo[migrationInfo.envName].categories, categoryTeamInfo);
    }
};
const buildPinpointInputParametersFromAmplifyMeta = (context) => {
    const { envName } = context.exeInfo.localEnvInfo;
    const { amplifyMeta } = context.exeInfo;
    const pinpointInputParameters = { envName };
    const categoryMeta = amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
    const availableChannels = (0, notifications_backend_cfg_channel_api_1.getAvailableChannels)();
    if (!categoryMeta) {
        return pinpointInputParameters;
    }
    const pinpointResourceName = Object.keys(categoryMeta).find((k) => categoryMeta[k].service === amplify_cli_core_1.AmplifySupportedService.PINPOINT);
    if (pinpointResourceName) {
        pinpointInputParameters.service = amplify_cli_core_1.AmplifySupportedService.PINPOINT;
        if (categoryMeta[pinpointResourceName].output) {
            for (const channelName of availableChannels) {
                if (channelName in categoryMeta[pinpointResourceName].output) {
                    pinpointInputParameters[channelName] = categoryMeta[pinpointResourceName][channelName];
                }
            }
        }
    }
    return pinpointInputParameters;
};
const buildPinpointInputParametersFromBackendConfig = (context) => {
    const { backendConfig } = context.exeInfo;
    const { envName } = context.exeInfo.localEnvInfo;
    const pinpointInputParameters = { envName };
    const categoryConfig = backendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
    const resourceNames = Object.keys(categoryConfig);
    const availableChannels = (0, notifications_backend_cfg_channel_api_1.getAvailableChannels)();
    for (const resourceName of resourceNames) {
        const resource = categoryConfig[resourceName];
        if (resource.service === amplify_cli_core_1.AmplifySupportedService.PINPOINT) {
            for (const channelName of availableChannels) {
                if (resource.channels.includes(channelName)) {
                    pinpointInputParameters[channelName] = { Enabled: true };
                }
            }
            return pinpointInputParameters;
        }
    }
    return pinpointInputParameters;
};
//# sourceMappingURL=multi-env-manager.js.map