"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iamRoleResourceHandler = exports.iamPolicyResourceHandler = void 0;
function iamPolicyResourceHandler(resourceName, resource) {
    const processedResource = {
        cfnExposedAttributes: {},
        ref: `IAMPolicy${resource.Properties.PolicyName}`,
    };
    return processedResource;
}
exports.iamPolicyResourceHandler = iamPolicyResourceHandler;
function iamRoleResourceHandler(resourceName, resource) {
    const processedResource = {
        cfnExposedAttributes: { Arn: 'Arn', RoleId: 'RoleId' },
        ref: `IAMRole${resource.Properties.RoleName}`,
        Arn: 'IAM-ARN',
        RoleId: `AIDAJQABLZS4A3QD${Math.floor(Math.random() * 100)}Q`,
    };
    return processedResource;
}
exports.iamRoleResourceHandler = iamRoleResourceHandler;
//# sourceMappingURL=iam.js.map