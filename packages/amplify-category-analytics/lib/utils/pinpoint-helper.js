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
exports.getPinpointRegionMappings = exports.getNotificationsCategoryHasPinpointIfExists = exports.pinpointHasInAppMessagingPolicy = exports.hasResource = exports.console = exports.pinpointInAppMessagingPolicyName = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const path = __importStar(require("path"));
const analytics_helper_1 = require("./analytics-helper");
exports.pinpointInAppMessagingPolicyName = 'pinpointInAppMessagingPolicyName';
const console = async (context) => {
    const amplifyMeta = context.amplify.getProjectMeta();
    let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS]);
    if (!pinpointApp) {
        pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS]);
    }
    if (pinpointApp) {
        const { Id, Region } = pinpointApp;
        const consoleUrl = `https://${Region}.console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/analytics/overview`;
        await (0, amplify_cli_core_1.open)(consoleUrl, { wait: false });
    }
    else {
        amplify_prompts_1.printer.error('Neither analytics nor notifications is enabled in the cloud.');
    }
};
exports.console = console;
const scanCategoryMetaForPinpoint = (categoryMeta) => {
    let result;
    if (categoryMeta) {
        const services = Object.keys(categoryMeta);
        for (const service of services) {
            const serviceMeta = categoryMeta[service];
            if (serviceMeta.service === 'Pinpoint' && serviceMeta.output && serviceMeta.output.Id) {
                result = {
                    Id: serviceMeta.output.Id,
                };
                if (serviceMeta.output.Name) {
                    result.Name = serviceMeta.output.Name;
                }
                else if (serviceMeta.output.appName) {
                    result.Name = serviceMeta.output.appName;
                }
                if (serviceMeta.output.Region) {
                    result.Region = serviceMeta.output.Region;
                }
                break;
            }
        }
    }
    return result;
};
const hasResource = (context) => {
    const amplifyMeta = context.amplify.getProjectMeta();
    let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS]);
    if (!pinpointApp) {
        pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS]);
    }
    return pinpointApp !== undefined;
};
exports.hasResource = hasResource;
const pinpointHasInAppMessagingPolicy = (context) => {
    var _a;
    const resources = (0, analytics_helper_1.getAnalyticsResources)(context, amplify_cli_core_1.AmplifySupportedService.PINPOINT);
    if ((resources === null || resources === void 0 ? void 0 : resources.length) === 0) {
        return false;
    }
    const pinpointCloudFormationTemplatePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), amplify_cli_core_1.AmplifyCategories.ANALYTICS, resources[0].resourceName, `pinpoint-cloudformation-template.json`);
    const { cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(pinpointCloudFormationTemplatePath, { throwIfNotExist: false }) || {};
    return !!((_a = cfnTemplate === null || cfnTemplate === void 0 ? void 0 : cfnTemplate.Parameters) === null || _a === void 0 ? void 0 : _a[exports.pinpointInAppMessagingPolicyName]);
};
exports.pinpointHasInAppMessagingPolicy = pinpointHasInAppMessagingPolicy;
const getNotificationsCategoryHasPinpointIfExists = () => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    if (amplifyMeta.notifications) {
        const categoryResources = amplifyMeta.notifications;
        const pinpointServiceResource = Object.keys(categoryResources).find((resource) => categoryResources[resource].service === amplify_cli_core_1.AmplifySupportedService.PINPOINT && categoryResources[resource].output.Id);
        if (pinpointServiceResource) {
            return {
                appId: categoryResources[pinpointServiceResource].output.Id,
                appName: pinpointServiceResource,
            };
        }
    }
    return undefined;
};
exports.getNotificationsCategoryHasPinpointIfExists = getNotificationsCategoryHasPinpointIfExists;
const getPinpointRegionMappings = async (context) => {
    const Mappings = {
        RegionMapping: {},
    };
    const regionMapping = await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'getPinpointRegionMapping', []);
    Object.keys(regionMapping).forEach((region) => {
        Mappings.RegionMapping[region] = {
            pinpointRegion: regionMapping[region],
        };
    });
    return Mappings;
};
exports.getPinpointRegionMappings = getPinpointRegionMappings;
//# sourceMappingURL=pinpoint-helper.js.map