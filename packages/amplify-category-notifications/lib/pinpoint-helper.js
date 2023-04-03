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
exports.isAnalyticsAdded = exports.getPinpointClient = exports.console = exports.scanCategoryMetaForPinpoint = exports.deletePinpointApp = exports.ensurePinpointApp = exports.pushAuthAndAnalyticsPinpointResources = exports.getPinpointAppStatusFromMeta = exports.createAnalyticsPinpointApp = exports.updateContextFromAnalyticsOutput = exports.getPinpointAppFromAnalyticsOutput = exports.viewShowAmplifyPushRequired = exports.getPinpointAppStatus = exports.getPinpointAppStatusNotifications = exports.buildPinpointChannelResponseSuccess = exports.isPinpointAppOwnedByNotifications = exports.isPinpointDeploymentRequired = exports.isPinpointAppDeployed = exports.IPinpointDeploymentStatus = exports.getPinpointApp = void 0;
const ora_1 = __importDefault(require("ora"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const plugin_client_api_analytics_1 = require("./plugin-client-api-analytics");
const authHelper = __importStar(require("./auth-helper"));
const pinpoint_name_1 = require("./pinpoint-name");
const notifications_backend_cfg_channel_api_1 = require("./notifications-backend-cfg-channel-api");
const notifications_amplify_meta_api_1 = require("./notifications-amplify-meta-api");
const notifications_backend_cfg_api_1 = require("./notifications-backend-cfg-api");
const providerName = 'awscloudformation';
const spinner = (0, ora_1.default)('');
const getPinpointApp = (context) => {
    const { amplifyMeta } = context.exeInfo;
    return (0, exports.scanCategoryMetaForPinpoint)(amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS], undefined);
};
exports.getPinpointApp = getPinpointApp;
var IPinpointDeploymentStatus;
(function (IPinpointDeploymentStatus) {
    IPinpointDeploymentStatus["NO_ENV"] = "NO_ENV";
    IPinpointDeploymentStatus["APP_NOT_CREATED"] = "APP_NOT_CREATED";
    IPinpointDeploymentStatus["APP_IS_CREATED_NOT_DEPLOYED"] = "APP_IS_CREATED_NOT_DEPLOYED";
    IPinpointDeploymentStatus["APP_IS_DEPLOYED"] = "APP_IS_DEPLOYED_ANALYTICS";
    IPinpointDeploymentStatus["APP_IS_DEPLOYED_CUSTOM"] = "APP_IS_DEPLOYED_NOTIFICATIONS";
})(IPinpointDeploymentStatus = exports.IPinpointDeploymentStatus || (exports.IPinpointDeploymentStatus = {}));
const isPinpointAppDeployed = (pinpointStatus) => pinpointStatus === "APP_IS_DEPLOYED_ANALYTICS" || pinpointStatus === "APP_IS_DEPLOYED_NOTIFICATIONS";
exports.isPinpointAppDeployed = isPinpointAppDeployed;
const isPinpointDeploymentRequired = (channelName, pinpointAppStatus) => !(0, exports.isPinpointAppDeployed)(pinpointAppStatus.status) && !(0, notifications_backend_cfg_channel_api_1.isChannelDeploymentDeferred)(channelName);
exports.isPinpointDeploymentRequired = isPinpointDeploymentRequired;
const isPinpointAppOwnedByNotifications = (pinpointStatus) => pinpointStatus === "APP_IS_DEPLOYED_NOTIFICATIONS";
exports.isPinpointAppOwnedByNotifications = isPinpointAppOwnedByNotifications;
const buildAnalyticsResourceFromPinpointApp = (pinpointApp, envName) => {
    const regulatedResourceName = pinpointApp.regulatedResourceName || pinpoint_name_1.PinpointName.extractResourceName(pinpointApp.Name, envName);
    const analyticsResource = {
        category: amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS,
        service: amplify_cli_core_1.AmplifySupportedService.PINPOINT,
        resourceName: regulatedResourceName,
        id: pinpointApp.Id,
        region: pinpointApp.Region,
        output: {
            Name: pinpointApp.Name,
            Region: pinpointApp.Region,
            Id: pinpointApp.Id,
            regulatedResourceName,
        },
    };
    return analyticsResource;
};
const buildPinpointChannelResponseSuccess = (action, deploymentType, channelName, output) => ({
    action,
    channel: channelName,
    deploymentType,
    response: {
        pluginName: amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS,
        resourceProviderServiceName: amplify_cli_core_1.AmplifySupportedService.PINPOINT,
        capability: amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS,
        subCapability: channelName,
        status: true,
    },
    output,
});
exports.buildPinpointChannelResponseSuccess = buildPinpointChannelResponseSuccess;
const getPinpointAppStatusNotifications = (notificationsMeta, amplifyMeta, envName) => {
    const scanOptions = {
        isRegulatingResourceName: true,
        envName,
    };
    return (notificationsMeta === null || notificationsMeta === void 0 ? void 0 : notificationsMeta.service) === amplify_cli_core_1.AmplifySupportedService.PINPOINT && (notificationsMeta === null || notificationsMeta === void 0 ? void 0 : notificationsMeta.output)
        ? notificationsMeta.output
        : (0, exports.scanCategoryMetaForPinpoint)(amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS], scanOptions);
};
exports.getPinpointAppStatusNotifications = getPinpointAppStatusNotifications;
const getPinpointAppStatus = async (context, amplifyMeta, pinpointNotificationsMeta, envName) => {
    var _a;
    const resultPinpointApp = {
        status: "APP_NOT_CREATED",
        app: undefined,
        context,
    };
    if (!envName) {
        resultPinpointApp.status = "NO_ENV";
        return resultPinpointApp;
    }
    const resources = await (0, plugin_client_api_analytics_1.invokeAnalyticsAPIGetResources)(context, amplify_cli_core_1.AmplifySupportedService.PINPOINT);
    if (resources.length > 0) {
        resultPinpointApp.app = resources[0];
        resultPinpointApp.status = resultPinpointApp.app.id
            ? "APP_IS_DEPLOYED_ANALYTICS"
            : "APP_IS_CREATED_NOT_DEPLOYED";
    }
    const notificationsPinpointApp = (0, exports.getPinpointAppStatusNotifications)(pinpointNotificationsMeta, amplifyMeta, envName);
    if ((notificationsPinpointApp === null || notificationsPinpointApp === void 0 ? void 0 : notificationsPinpointApp.Id) && notificationsPinpointApp.Id !== ((_a = resultPinpointApp === null || resultPinpointApp === void 0 ? void 0 : resultPinpointApp.app) === null || _a === void 0 ? void 0 : _a.id)) {
        resultPinpointApp.status = "APP_IS_DEPLOYED_NOTIFICATIONS";
        resultPinpointApp.app = buildAnalyticsResourceFromPinpointApp(notificationsPinpointApp, envName);
    }
    return resultPinpointApp;
};
exports.getPinpointAppStatus = getPinpointAppStatus;
const viewShowAmplifyPushRequired = (pinpointStatus) => {
    let pinpointStatusMessage = '';
    switch (pinpointStatus) {
        case "APP_NOT_CREATED":
            pinpointStatusMessage = 'Pinpoint resource is not created';
            break;
        case "APP_IS_CREATED_NOT_DEPLOYED":
            pinpointStatusMessage = 'Pinpoint resource is only locally created';
            break;
        case "APP_IS_DEPLOYED_NOTIFICATIONS":
            pinpointStatusMessage = 'Pinpoint resource is created outside of Amplify';
            break;
        case "NO_ENV":
            pinpointStatusMessage = 'Pinpoint resource status is unknown';
            break;
        default:
            pinpointStatusMessage = 'Pinpoint resource is not initialized in this environment';
    }
    amplify_prompts_1.printer.warn(pinpointStatusMessage);
    if (pinpointStatus === "APP_IS_CREATED_NOT_DEPLOYED" ||
        pinpointStatus === "APP_NOT_CREATED") {
        amplify_prompts_1.printer.warn('Run "amplify push" to deploy the Pinpoint resource and then retry...');
    }
};
exports.viewShowAmplifyPushRequired = viewShowAmplifyPushRequired;
const getPinpointAppFromAnalyticsOutput = (analyticsMeta) => {
    const pinpointApp = {
        Id: analyticsMeta.id,
        Name: analyticsMeta.output.appName,
        Region: analyticsMeta.region,
        regulatedResourceName: analyticsMeta.resourceName,
    };
    return pinpointApp;
};
exports.getPinpointAppFromAnalyticsOutput = getPinpointAppFromAnalyticsOutput;
const updateContextFromAnalyticsOutput = async (context, amplifyMeta, pinpointAppStatus) => {
    var _a, _b;
    if (((_a = pinpointAppStatus.app) === null || _a === void 0 ? void 0 : _a.output) && ((_b = pinpointAppStatus.app) === null || _b === void 0 ? void 0 : _b.resourceName)) {
        const pinpointApp = (0, exports.getPinpointAppFromAnalyticsOutput)(pinpointAppStatus.app);
        const resourceName = pinpointAppStatus.app.resourceName;
        context.exeInfo.amplifyMeta = (0, notifications_amplify_meta_api_1.constructResourceMeta)(amplifyMeta, resourceName, pinpointApp);
        context.exeInfo.backendConfig = await (0, notifications_backend_cfg_api_1.addPartialNotificationsBackendConfig)(resourceName, context.exeInfo.backendConfig);
        return pinpointApp;
    }
    return undefined;
};
exports.updateContextFromAnalyticsOutput = updateContextFromAnalyticsOutput;
const createAnalyticsPinpointApp = async (context) => {
    const pushResponse = await (0, plugin_client_api_analytics_1.invokeAnalyticsPush)(context, amplify_cli_core_1.AmplifySupportedService.PINPOINT);
    if (!pushResponse.status) {
        throw new amplify_cli_core_1.AmplifyFault('PushResourcesFault', {
            message: `Failed to create Pinpoint resource for the given environment: ${pushResponse.reasonMsg}`,
        });
    }
};
exports.createAnalyticsPinpointApp = createAnalyticsPinpointApp;
const getPinpointAppStatusFromMeta = async (context, pinpointNotificationsMeta, appEnvName) => {
    const amplifyMeta = context.exeInfo.amplifyMeta || amplify_cli_core_1.stateManager.getMeta();
    const envName = appEnvName || amplify_cli_core_1.stateManager.getCurrentEnvName();
    return (0, exports.getPinpointAppStatus)(context, amplifyMeta, pinpointNotificationsMeta, envName);
};
exports.getPinpointAppStatusFromMeta = getPinpointAppStatusFromMeta;
const pushAuthAndAnalyticsPinpointResources = async (context, pinpointAppStatus) => {
    await (0, exports.createAnalyticsPinpointApp)(context);
    return {
        ...pinpointAppStatus,
        status: "APP_IS_DEPLOYED_ANALYTICS",
    };
};
exports.pushAuthAndAnalyticsPinpointResources = pushAuthAndAnalyticsPinpointResources;
const ensurePinpointApp = async (context, pinpointNotificationsMeta, appStatus, appEnvName) => {
    var _a, _b, _c, _d, _e, _f;
    let pinpointApp;
    let resourceName;
    const amplifyMeta = context.exeInfo.amplifyMeta || amplify_cli_core_1.stateManager.getMeta();
    const envName = appEnvName || context.exeInfo.localEnvInfo.envName || amplify_cli_core_1.stateManager.getCurrentEnvName() || '';
    const pinpointAppStatus = appStatus || (await (0, exports.getPinpointAppStatus)(context, amplifyMeta, pinpointNotificationsMeta, envName));
    switch (pinpointAppStatus.status) {
        case "NO_ENV": {
            amplify_prompts_1.printer.warn('Current ENV not configured!');
            return pinpointAppStatus;
        }
        case "APP_IS_DEPLOYED_NOTIFICATIONS": {
            if (((_a = pinpointAppStatus.app) === null || _a === void 0 ? void 0 : _a.output) && ((_b = pinpointAppStatus.app) === null || _b === void 0 ? void 0 : _b.resourceName)) {
                pinpointApp = (_c = pinpointAppStatus.app) === null || _c === void 0 ? void 0 : _c.output;
                resourceName = (_d = pinpointAppStatus.app) === null || _d === void 0 ? void 0 : _d.resourceName;
                (0, notifications_amplify_meta_api_1.constructResourceMeta)(amplifyMeta, resourceName, pinpointApp);
            }
            break;
        }
        case "APP_IS_DEPLOYED_ANALYTICS": {
            if (pinpointNotificationsMeta === null || pinpointNotificationsMeta === void 0 ? void 0 : pinpointNotificationsMeta.output) {
                pinpointApp = pinpointNotificationsMeta === null || pinpointNotificationsMeta === void 0 ? void 0 : pinpointNotificationsMeta.output;
                pinpointApp.regulatedResourceName = pinpoint_name_1.PinpointName.extractResourceName(pinpointNotificationsMeta.Name, envName);
                resourceName = pinpointApp.regulatedResourceName;
                context.exeInfo.amplifyMeta = (0, notifications_amplify_meta_api_1.constructResourceMeta)(amplifyMeta, resourceName, pinpointApp);
            }
            else {
                pinpointApp = await (0, exports.updateContextFromAnalyticsOutput)(context, amplifyMeta, pinpointAppStatus);
                resourceName = (_e = pinpointAppStatus === null || pinpointAppStatus === void 0 ? void 0 : pinpointAppStatus.app) === null || _e === void 0 ? void 0 : _e.resourceName;
                if (!resourceName) {
                    throw new amplify_cli_core_1.AmplifyFault('ResourceNotFoundFault', {
                        message: `Pinpoint resource name is not found in amplify-meta.json : ${pinpointAppStatus === null || pinpointAppStatus === void 0 ? void 0 : pinpointAppStatus.app}`,
                    });
                }
                context.exeInfo.amplifyMeta = (0, notifications_amplify_meta_api_1.constructResourceMeta)(amplifyMeta, resourceName, pinpointApp);
            }
            context.exeInfo.backendConfig = await (0, notifications_backend_cfg_api_1.addPartialNotificationsBackendConfig)(resourceName, context.exeInfo.backendConfig);
            break;
        }
        case "APP_NOT_CREATED": {
            amplify_prompts_1.printer.warn('Adding notifications would add a Pinpoint resource from Analytics category if not already added');
            const resourceResult = await (0, plugin_client_api_analytics_1.invokeAnalyticsAPICreateResource)(context, amplify_cli_core_1.AmplifySupportedService.PINPOINT);
            resourceName = resourceResult.resourceName;
            context.exeInfo.amplifyMeta = await (0, notifications_amplify_meta_api_1.addPartialNotificationsAppMeta)(context, resourceName);
            context.exeInfo.backendConfig = await (0, notifications_backend_cfg_api_1.addPartialNotificationsBackendConfig)(resourceName, context.exeInfo.backendConfig);
            (0, exports.viewShowAmplifyPushRequired)(pinpointAppStatus.status);
            break;
        }
        case "APP_IS_CREATED_NOT_DEPLOYED": {
            resourceName = (_f = pinpointAppStatus.app) === null || _f === void 0 ? void 0 : _f.resourceName;
            if (resourceName) {
                context.exeInfo.amplifyMeta = await (0, notifications_amplify_meta_api_1.addPartialNotificationsAppMeta)(context, resourceName);
                context.exeInfo.backendConfig = await (0, notifications_backend_cfg_api_1.addPartialNotificationsBackendConfig)(resourceName, context.exeInfo.backendConfig);
            }
            (0, exports.viewShowAmplifyPushRequired)(pinpointAppStatus.status);
            break;
        }
        default:
            throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
                message: `Invalid Pinpoint App Status ${pinpointAppStatus.status} : App: ${pinpointAppStatus.app}`,
            });
    }
    if (resourceName && context.exeInfo.amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS]) {
        context.exeInfo.serviceMeta = context.exeInfo.amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS][resourceName];
        context.exeInfo.pinpointApp = context.exeInfo.serviceMeta.output;
    }
    pinpointAppStatus.context = context;
    return pinpointAppStatus;
};
exports.ensurePinpointApp = ensurePinpointApp;
const deletePinpointApp = async (context) => {
    const { amplifyMeta } = context.exeInfo;
    let pinpointApp = (0, exports.scanCategoryMetaForPinpoint)(amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS], undefined);
    if (pinpointApp) {
        await authHelper.deleteRolePolicy(context);
        pinpointApp = (await deleteApp(context, pinpointApp.Id));
        removeCategoryMetaForPinpoint(amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS], pinpointApp.Id);
        removeCategoryMetaForPinpoint(amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS], pinpointApp.Id);
    }
};
exports.deletePinpointApp = deletePinpointApp;
const scanCategoryMetaForPinpoint = (categoryMeta, options) => {
    let result;
    if (categoryMeta) {
        const resources = Object.keys(categoryMeta);
        for (const resourceName of resources) {
            const serviceMeta = categoryMeta[resourceName];
            if (serviceMeta.service === amplify_cli_core_1.AmplifySupportedService.PINPOINT && serviceMeta.output && serviceMeta.output.Id) {
                result = {
                    Id: serviceMeta.output.Id,
                    Name: serviceMeta.output.Name || serviceMeta.output.appName,
                    Region: serviceMeta.output.Region,
                    lastPushTimeStamp: serviceMeta.lastPushTimeStamp,
                };
                if (options && options.isRegulatingResourceName) {
                    const regulatedResourceName = pinpoint_name_1.PinpointName.extractResourceName(result.Name, options.envName);
                    options.regulatedResourceName = regulatedResourceName;
                    if (resourceName !== regulatedResourceName) {
                        categoryMeta[regulatedResourceName] = serviceMeta;
                        delete categoryMeta[resourceName];
                    }
                }
                break;
            }
        }
    }
    return result;
};
exports.scanCategoryMetaForPinpoint = scanCategoryMetaForPinpoint;
const removeCategoryMetaForPinpoint = (categoryMeta, pinpointAppId) => {
    if (categoryMeta) {
        const services = Object.keys(categoryMeta);
        for (const service of services) {
            const serviceMeta = categoryMeta[service];
            if (serviceMeta.service === 'Pinpoint' && serviceMeta.output && serviceMeta.output.Id === pinpointAppId) {
                delete categoryMeta[service];
            }
        }
    }
};
const deleteApp = async (context, pinpointAppId) => {
    const params = {
        ApplicationId: pinpointAppId,
    };
    const envName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    const pinpointClient = await (0, exports.getPinpointClient)(context, 'delete', envName);
    spinner.start('Deleting Pinpoint app.');
    return new Promise((resolve, reject) => {
        pinpointClient.deleteApp(params, (err, data) => {
            if (err && err.code === 'NotFoundException') {
                spinner.succeed(`Project with ID '${params.ApplicationId}' was already deleted from the cloud.`);
                resolve({
                    Id: params.ApplicationId,
                });
            }
            else if (err) {
                spinner.fail('Pinpoint project deletion error');
                reject(err);
            }
            else {
                spinner.succeed(`Successfully deleted Pinpoint project: ${data.ApplicationResponse.Name}`);
                data.ApplicationResponse.Region = pinpointClient.config.region;
                resolve(data.ApplicationResponse);
            }
        });
    });
};
const console = async (context) => {
    const { amplifyMeta } = context.exeInfo;
    const pinpointApp = (0, exports.scanCategoryMetaForPinpoint)(amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS], undefined);
    if (pinpointApp) {
        const { Id, Region } = pinpointApp;
        const consoleUrl = `https://${Region}.console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/settings`;
        await (0, amplify_cli_core_1.open)(consoleUrl, { wait: false });
    }
    else {
        amplify_prompts_1.printer.error('Neither notifications nor analytics is enabled in the cloud.');
    }
};
exports.console = console;
const getPinpointClient = async (context, action, envName) => {
    var _a;
    const providerPlugins = context.amplify.getProviderPlugins(context);
    const provider = await (_a = providerPlugins[providerName], Promise.resolve().then(() => __importStar(require(_a))));
    return provider.getConfiguredPinpointClient(context, amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS, action, envName);
};
exports.getPinpointClient = getPinpointClient;
const isAnalyticsAdded = (context) => {
    const { amplifyMeta } = context.exeInfo;
    return !!(0, exports.scanCategoryMetaForPinpoint)(amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS], undefined);
};
exports.isAnalyticsAdded = isAnalyticsAdded;
//# sourceMappingURL=pinpoint-helper.js.map