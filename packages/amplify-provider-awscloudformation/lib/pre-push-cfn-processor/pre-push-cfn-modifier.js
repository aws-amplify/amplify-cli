"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prePushCfnTemplateModifier = void 0;
const lodash_1 = __importDefault(require("lodash"));
const s3_sse_modifier_1 = require("./modifiers/s3-sse-modifier");
const iam_role_permissions_boundary_modifier_1 = require("./modifiers/iam-role-permissions-boundary-modifier");
const prePushCfnTemplateModifier = async (template) => {
    if (!template.Resources) {
        return;
    }
    for (const [resourceName, resource] of Object.entries(template.Resources)) {
        const modifiers = getResourceModifiers(resource.Type);
        let mutatedResource = lodash_1.default.cloneDeep(resource);
        for (const modifier of modifiers) {
            mutatedResource = await modifier(mutatedResource);
        }
        template.Resources[resourceName] = mutatedResource;
    }
};
exports.prePushCfnTemplateModifier = prePushCfnTemplateModifier;
const getResourceModifiers = (type) => {
    return lodash_1.default.get(resourceTransformerRegistry, type, [identityResourceModifier]);
};
const resourceTransformerRegistry = {
    'AWS::S3::Bucket': [s3_sse_modifier_1.applyS3SSEModification],
    'AWS::IAM::Role': [iam_role_permissions_boundary_modifier_1.iamRolePermissionsBoundaryModifier],
};
const identityResourceModifier = async (resource) => resource;
//# sourceMappingURL=pre-push-cfn-modifier.js.map