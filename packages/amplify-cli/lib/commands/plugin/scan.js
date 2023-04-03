"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const plugin_manager_1 = require("../../plugin-manager");
const run = async () => {
    await (0, plugin_manager_1.scan)();
};
exports.run = run;
//# sourceMappingURL=scan.js.map