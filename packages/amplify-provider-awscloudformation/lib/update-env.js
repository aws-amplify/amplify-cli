"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEnv = void 0;
const permissions_boundary_1 = require("./permissions-boundary/permissions-boundary");
const updateEnv = async (context) => {
    await (0, permissions_boundary_1.configurePermissionsBoundaryForExistingEnv)(context);
};
exports.updateEnv = updateEnv;
//# sourceMappingURL=update-env.js.map