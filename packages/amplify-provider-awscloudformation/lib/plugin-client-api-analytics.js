"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokePostPushAnalyticsUpdate = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const invokePostPushAnalyticsUpdate = async (context) => (await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.ANALYTICS, undefined, 'analyticsPluginAPIPostPush', [
    context,
]));
exports.invokePostPushAnalyticsUpdate = invokePostPushAnalyticsUpdate;
//# sourceMappingURL=plugin-client-api-analytics.js.map