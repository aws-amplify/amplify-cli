"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require('uuid');
function getAllDefaults(project) {
    const region = project.amplifyMeta.providers.awscloudformation.Region;
    const [shortId] = uuid.v4().split('-');
    const authRoleName = {
        Ref: 'AuthRoleName',
    };
    const unauthRoleName = {
        Ref: 'UnauthRoleName',
    };
    const defaults = {
        resourceName: `${shortId}`,
        region,
        inferPolicyName: `inferPolicy${shortId}`,
        service: 'SageMaker',
        authRoleName,
        unauthRoleName,
    };
    return defaults;
}
exports.default = getAllDefaults;
//# sourceMappingURL=infer-defaults.js.map