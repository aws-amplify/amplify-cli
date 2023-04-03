"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationCheck = exports.analyticsMigrations = void 0;
const in_app_messaging_migration_1 = require("./in-app-messaging-migration");
const analyticsMigrations = async (context) => {
    await (0, in_app_messaging_migration_1.inAppMessagingMigrationCheck)(context);
};
exports.analyticsMigrations = analyticsMigrations;
const migrationCheck = async (context) => {
    if (['add', 'update', 'push'].includes(context.input.command)) {
        await (0, exports.analyticsMigrations)(context);
    }
};
exports.migrationCheck = migrationCheck;
//# sourceMappingURL=index.js.map