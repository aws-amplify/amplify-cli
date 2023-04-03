"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isResourceNameUnique = void 0;
const state_manager_1 = require("../state-manager");
const isResourceNameUnique = (category, resourceName, throwOnMatch = true) => {
    const meta = state_manager_1.stateManager.getMeta();
    const resourceNames = Object.keys((meta === null || meta === void 0 ? void 0 : meta[category]) || {});
    const matchIdx = resourceNames.map((name) => name.toLowerCase()).indexOf(resourceName.toLowerCase());
    if (matchIdx === -1) {
        return true;
    }
    if (throwOnMatch) {
        const msg = `A resource named '${resourceNames[matchIdx]}' already exists. Amplify resource names must be unique and are case-insensitive.`;
        throw new Error(msg);
    }
    else {
        return false;
    }
};
exports.isResourceNameUnique = isResourceNameUnique;
//# sourceMappingURL=isResourceNameUnique.js.map