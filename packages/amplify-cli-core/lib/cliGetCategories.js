"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmplifyResourceByCategories = void 0;
const state_manager_1 = require("./state-manager");
function getAmplifyResourceByCategories(category) {
    const meta = state_manager_1.stateManager.getMeta();
    return Object.keys(meta[category] || {}).filter((r) => meta[category][r].mobileHubMigrated !== true);
}
exports.getAmplifyResourceByCategories = getAmplifyResourceByCategories;
//# sourceMappingURL=cliGetCategories.js.map