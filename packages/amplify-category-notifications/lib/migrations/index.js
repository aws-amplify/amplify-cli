"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationCheck = void 0;
const plugin_client_api_analytics_1 = require("../plugin-client-api-analytics");
const migrationCheck = async (context) => {
    if (['add', 'configure', 'update', 'push'].includes(context.input.command)) {
        await (0, plugin_client_api_analytics_1.invokeAnalyticsMigrations)(context);
    }
};
exports.migrationCheck = migrationCheck;
//# sourceMappingURL=index.js.map