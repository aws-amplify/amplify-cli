"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const plugin_client_api_notifications_1 = require("../../plugin-client-api-notifications");
const subcommand = 'remove';
const category = 'analytics';
exports.name = subcommand;
const run = async (context) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;
    const throwIfUsedByNotifications = async (selectedAnalyticsResource) => {
        const isResourceInUse = await (0, plugin_client_api_notifications_1.checkResourceInUseByNotifications)(context, selectedAnalyticsResource);
        if (isResourceInUse) {
            throw new amplify_cli_core_1.AmplifyError('ResourceInUseError', {
                message: `Analytics resource ${selectedAnalyticsResource} is being used by the notifications category and cannot be removed`,
                resolution: `Run 'amplify remove notifications', then retry removing analytics`,
            });
        }
    };
    await amplify.removeResource(context, category, resourceName, { headless: false }, throwIfUsedByNotifications);
};
exports.run = run;
//# sourceMappingURL=remove.js.map