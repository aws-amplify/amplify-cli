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
        identifyPolicyName: `identifyPolicy${shortId}`,
        service: 'Rekognition',
        authRoleName,
        unauthRoleName,
        adminAuthProtected: 'DISALLOW',
        adminGuestProtected: 'DISALLOW',
    };
    return defaults;
}
exports.default = getAllDefaults;
//# sourceMappingURL=identify-defaults.js.map