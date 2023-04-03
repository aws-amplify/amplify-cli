"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iamRolePermissionsBoundaryModifier = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const iamRolePermissionsBoundaryModifier = async (resource) => {
    var _a;
    if ((_a = resource === null || resource === void 0 ? void 0 : resource.Properties) === null || _a === void 0 ? void 0 : _a.PermissionsBoundary) {
        return resource;
    }
    const policyArn = (0, amplify_cli_core_1.getPermissionsBoundaryArn)();
    if (!policyArn) {
        return resource;
    }
    resource.Properties.PermissionsBoundary = policyArn;
    return resource;
};
exports.iamRolePermissionsBoundaryModifier = iamRolePermissionsBoundaryModifier;
//# sourceMappingURL=iam-role-permissions-boundary-modifier.js.map