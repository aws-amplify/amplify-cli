"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectHasAuth = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const projectHasAuth = () => {
    const meta = amplify_cli_core_1.stateManager.getMeta(undefined, { throwIfNotExist: false });
    const existingAuthResources = Object.entries((meta === null || meta === void 0 ? void 0 : meta.auth) || {});
    if (existingAuthResources.length > 0) {
        return true;
    }
    return false;
};
exports.projectHasAuth = projectHasAuth;
//# sourceMappingURL=project-has-auth.js.map