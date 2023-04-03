"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.alias = exports.name = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const chalk_1 = __importDefault(require("chalk"));
const notifications_amplify_meta_api_1 = require("../../notifications-amplify-meta-api");
const notifications_api_1 = require("../../notifications-api");
const notifications_backend_cfg_channel_api_1 = require("../../notifications-backend-cfg-channel-api");
exports.name = 'status';
exports.alias = ['list', 'ls'];
const viewStyles = {
    enabled: chalk_1.default.bold.green,
    disabled: chalk_1.default.bold.red,
    pendingDeployment: chalk_1.default.yellowBright,
    deployed: chalk_1.default.cyanBright,
    notDeployed: chalk_1.default.dim,
    url: chalk_1.default.bold.yellow,
    underline: chalk_1.default.blue.underline,
    appName: chalk_1.default.bold.yellowBright,
};
const getDeployedStyledStatus = (deployedChannel, deployedChannels, configuredState) => {
    if (deployedChannels.enabledChannels.includes(deployedChannel)) {
        if (configuredState === 'Enabled') {
            return viewStyles.deployed('Deployed');
        }
        return viewStyles.pendingDeployment('Not Deployed');
    }
    if (deployedChannels.disabledChannels.includes(deployedChannel)) {
        if (configuredState === 'Disabled') {
            return viewStyles.deployed('Deployed');
        }
        return viewStyles.pendingDeployment('Not Deployed');
    }
    return viewStyles.notDeployed('Not Deployed');
};
const viewNotificationsAppURL = async (context, appName) => {
    const meta = await (0, notifications_amplify_meta_api_1.getNotificationsAppMeta)(context.exeInfo.amplifyMeta, appName);
    if (meta === null || meta === void 0 ? void 0 : meta.Id) {
        const consoleUrl = `https://${meta.Region}.console.aws.amazon.com/pinpoint/home/?region=${meta.Region}#/apps/${meta.Id}/notifications`;
        amplify_prompts_1.printer.info(`\nPinpoint App: ${viewStyles.underline(viewStyles.url(consoleUrl))}`);
    }
};
const viewDisplayChannelAvailability = async (context, backend) => {
    const tableOptions = [['Channel', 'Status', 'Deployed/Not Deployed']];
    for (const enabledChannel of backend.local.channels.enabledChannels) {
        const channelViewInfo = (0, notifications_backend_cfg_channel_api_1.getChannelViewInfo)(enabledChannel);
        tableOptions.push([
            channelViewInfo.viewName,
            viewStyles.enabled('Enabled'),
            getDeployedStyledStatus(enabledChannel, backend.deployed.channels, 'Enabled'),
        ]);
    }
    for (const disabledChannel of backend.local.channels.disabledChannels) {
        const channelViewInfo = (0, notifications_backend_cfg_channel_api_1.getChannelViewInfo)(disabledChannel);
        tableOptions.push([
            channelViewInfo.viewName,
            viewStyles.disabled('Disabled'),
            getDeployedStyledStatus(disabledChannel, backend.deployed.channels, 'Disabled'),
        ]);
    }
    context.print.table(tableOptions, { format: 'lean' });
};
const viewDisplayNotificationsResourceInfo = async (backend) => {
    amplify_prompts_1.printer.info(`\n\nApplication : ${viewStyles.appName(backend.local.config.serviceName)} (${backend.local.config.service})`);
};
const run = async (context) => {
    const backend = await (0, notifications_api_1.getNotificationConfigStatus)(context);
    if (backend) {
        await viewDisplayNotificationsResourceInfo(backend);
        await viewNotificationsAppURL(context, backend.local.config.serviceName);
        await viewDisplayChannelAvailability(context, backend);
    }
};
exports.run = run;
//# sourceMappingURL=status.js.map