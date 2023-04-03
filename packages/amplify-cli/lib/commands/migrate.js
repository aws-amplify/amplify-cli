"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const migrate_project_1 = require("../migrate-project");
const run = async (context) => {
    await (0, migrate_project_1.migrateProject)(context);
};
exports.run = run;
//# sourceMappingURL=migrate.js.map