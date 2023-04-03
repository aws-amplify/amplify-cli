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
exports.handleAmplifyEvent = exports.executeAmplifyCommand = exports.getPermissionPolicies = exports.console = exports.analyticsPluginAPIPush = exports.analyticsPluginAPIPostPush = exports.analyticsPluginAPIMigrations = exports.analyticsPluginAPIPinpointHasInAppMessagingPolicy = exports.analyticsPluginAPIToggleNotificationChannel = exports.analyticsPluginAPICreateResource = exports.analyticsPluginAPIGetResources = exports.migrate = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const path = __importStar(require("path"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const pinpointHelper = __importStar(require("./utils/pinpoint-helper"));
const kinesisHelper = __importStar(require("./utils/kinesis-helper"));
const migrations_1 = require("./migrations");
var pinpoint_walkthrough_1 = require("./provider-utils/awscloudformation/service-walkthroughs/pinpoint-walkthrough");
Object.defineProperty(exports, "migrate", { enumerable: true, get: function () { return pinpoint_walkthrough_1.migrate; } });
var analytics_resource_api_1 = require("./analytics-resource-api");
Object.defineProperty(exports, "analyticsPluginAPIGetResources", { enumerable: true, get: function () { return analytics_resource_api_1.analyticsPluginAPIGetResources; } });
Object.defineProperty(exports, "analyticsPluginAPICreateResource", { enumerable: true, get: function () { return analytics_resource_api_1.analyticsPluginAPICreateResource; } });
Object.defineProperty(exports, "analyticsPluginAPIToggleNotificationChannel", { enumerable: true, get: function () { return analytics_resource_api_1.analyticsPluginAPIToggleNotificationChannel; } });
Object.defineProperty(exports, "analyticsPluginAPIPinpointHasInAppMessagingPolicy", { enumerable: true, get: function () { return analytics_resource_api_1.analyticsPluginAPIPinpointHasInAppMessagingPolicy; } });
Object.defineProperty(exports, "analyticsPluginAPIMigrations", { enumerable: true, get: function () { return analytics_resource_api_1.analyticsPluginAPIMigrations; } });
Object.defineProperty(exports, "analyticsPluginAPIPostPush", { enumerable: true, get: function () { return analytics_resource_api_1.analyticsPluginAPIPostPush; } });
Object.defineProperty(exports, "analyticsPluginAPIPush", { enumerable: true, get: function () { return analytics_resource_api_1.analyticsPluginAPIPush; } });
const category = 'analytics';
const console = async (context) => {
    const hasKinesisResource = kinesisHelper.hasResource(context);
    const hasPinpointResource = pinpointHelper.hasResource(context);
    let selectedResource;
    if (hasKinesisResource && hasPinpointResource) {
        selectedResource = await amplify_prompts_1.prompter.pick('Select resource', ['kinesis', 'pinpoint']);
    }
    else if (hasKinesisResource) {
        selectedResource = 'kinesis';
    }
    else if (hasPinpointResource) {
        selectedResource = 'pinpoint';
    }
    else {
        amplify_prompts_1.printer.error('Neither analytics nor notifications is enabled in the cloud.');
    }
    switch (selectedResource) {
        case 'kinesis':
            await kinesisHelper.console(context);
            break;
        case 'pinpoint':
            await pinpointHelper.console(context);
            break;
        default:
            break;
    }
};
exports.console = console;
const getPermissionPolicies = async (context, resourceOpsMapping) => {
    var _a;
    const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
    const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
    const permissionPolicies = [];
    const resourceAttributes = [];
    for (const resourceName of Object.keys(resourceOpsMapping)) {
        try {
            const providerName = amplifyMeta[category][resourceName].providerPlugin;
            if (providerName) {
                const providerController = await (_a = `./provider-utils/${providerName}/index`, Promise.resolve().then(() => __importStar(require(_a))));
                const { policy, attributes } = providerController.getPermissionPolicies(context, amplifyMeta[category][resourceName].service, resourceName, resourceOpsMapping[resourceName]);
                permissionPolicies.push(policy);
                resourceAttributes.push({ resourceName, attributes, category });
            }
            else {
                amplify_prompts_1.printer.error(`Provider not configured for ${category}: ${resourceName}`);
            }
        }
        catch (e) {
            throw new amplify_cli_core_1.AmplifyFault('AnalyticsCategoryFault', {
                message: `Could not get policies for ${category}: ${resourceName}`,
            }, e);
        }
    }
    return { permissionPolicies, resourceAttributes };
};
exports.getPermissionPolicies = getPermissionPolicies;
const executeAmplifyCommand = async (context) => {
    var _a;
    context.exeInfo = context.amplify.getProjectDetails();
    await (0, migrations_1.migrationCheck)(context);
    let commandPath = path.normalize(path.join(__dirname, 'commands'));
    commandPath =
        context.input.command === 'help' ? path.join(commandPath, category) : path.join(commandPath, category, context.input.command);
    const commandModule = await (_a = commandPath, Promise.resolve().then(() => __importStar(require(_a))));
    await commandModule.run(context);
};
exports.executeAmplifyCommand = executeAmplifyCommand;
const handleAmplifyEvent = async (__context, args) => {
    amplify_prompts_1.printer.info(`${category} handleAmplifyEvent to be implemented`);
    amplify_prompts_1.printer.info(`Received event args ${args}`);
};
exports.handleAmplifyEvent = handleAmplifyEvent;
//# sourceMappingURL=index.js.map