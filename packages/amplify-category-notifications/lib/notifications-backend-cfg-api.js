"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeNotificationsAppConfig = exports.addPartialNotificationsBackendConfig = exports.isNotificationsResourceCreatedInBackendConfig = exports.getCurrentNotificationsAppConfig = exports.getNotificationsAppConfig = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const getNotificationsAppConfig = async (backendConfig) => {
    const notificationConfigList = await getNotificationsAppConfigList(backendConfig);
    if (notificationConfigList) {
        return notificationConfigList[0];
    }
    return undefined;
};
exports.getNotificationsAppConfig = getNotificationsAppConfig;
const getCurrentNotificationsAppConfig = async (currentBackendConfig) => currentBackendConfig ? (0, exports.getNotificationsAppConfig)(currentBackendConfig) : undefined;
exports.getCurrentNotificationsAppConfig = getCurrentNotificationsAppConfig;
const isNotificationsResourceCreatedInBackendConfig = (resourceBackendConfig) => resourceBackendConfig.service === amplify_cli_core_1.AmplifySupportedService.PINPOINT;
exports.isNotificationsResourceCreatedInBackendConfig = isNotificationsResourceCreatedInBackendConfig;
const addPartialNotificationsBackendConfig = async (pinpointResourceName, backendConfig) => {
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    const tmpBackendConfig = backendConfig || amplify_cli_core_1.stateManager.getBackendConfig(projectPath);
    const emptyResourceConfig = {
        service: amplify_cli_core_1.AmplifySupportedService.PINPOINT,
        channels: [],
        channelConfig: {},
    };
    let notificationsConfig = tmpBackendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
    notificationsConfig = notificationsConfig || {
        [pinpointResourceName]: emptyResourceConfig,
    };
    notificationsConfig[pinpointResourceName] = notificationsConfig[pinpointResourceName] || emptyResourceConfig;
    tmpBackendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS] = notificationsConfig;
    return tmpBackendConfig;
};
exports.addPartialNotificationsBackendConfig = addPartialNotificationsBackendConfig;
const getNotificationsAppConfigList = async (backendConfig, appName) => {
    const tmpBackendConfig = backendConfig || amplify_cli_core_1.stateManager.getBackendConfig();
    const notificationsConfig = tmpBackendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
    const notificationsConfigList = [];
    if (notificationsConfig) {
        for (const resourceName of Object.keys(notificationsConfig)) {
            if (!appName || appName === resourceName) {
                notificationsConfigList.push({
                    ...notificationsConfig[resourceName],
                    serviceName: resourceName,
                });
            }
        }
    }
    return notificationsConfigList;
};
const removeNotificationsAppConfig = async (context) => {
    const backendConfig = context.exeInfo.backendConfig || amplify_cli_core_1.stateManager.getBackendConfig();
    if (amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS in backendConfig) {
        delete backendConfig[amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS];
    }
    context.exeInfo.backendConfig = backendConfig;
    return context;
};
exports.removeNotificationsAppConfig = removeNotificationsAppConfig;
//# sourceMappingURL=notifications-backend-cfg-api.js.map