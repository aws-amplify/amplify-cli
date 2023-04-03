"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeNotificationsAPIGetAvailableChannelNames = exports.checkResourceInUseByNotifications = exports.invokeNotificationsAPIRecursiveRemoveApp = exports.invokeNotificationsAPIGetResource = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const invokeNotificationsAPIGetResource = async (context) => {
    const notificationsResource = await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS, undefined, 'notificationsPluginAPIGetResource', [context]);
    return notificationsResource ? notificationsResource : undefined;
};
exports.invokeNotificationsAPIGetResource = invokeNotificationsAPIGetResource;
const invokeNotificationsAPIRecursiveRemoveApp = async (context, appName) => (await context.amplify.invokePluginMethod(context, 'notifications', undefined, 'notificationsPluginAPIRemoveApp', [
    context,
    appName,
]));
exports.invokeNotificationsAPIRecursiveRemoveApp = invokeNotificationsAPIRecursiveRemoveApp;
const checkResourceInUseByNotifications = async (context, resourceName) => {
    const notificationsResource = await (0, exports.invokeNotificationsAPIGetResource)(context);
    if (!(notificationsResource === null || notificationsResource === void 0 ? void 0 : notificationsResource.resourceName))
        return false;
    return (notificationsResource === null || notificationsResource === void 0 ? void 0 : notificationsResource.resourceName) === resourceName;
};
exports.checkResourceInUseByNotifications = checkResourceInUseByNotifications;
const invokeNotificationsAPIGetAvailableChannelNames = async (context) => (await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS, undefined, 'notificationsAPIGetAvailableChannelNames', [context]));
exports.invokeNotificationsAPIGetAvailableChannelNames = invokeNotificationsAPIGetAvailableChannelNames;
//# sourceMappingURL=plugin-client-api-notifications.js.map