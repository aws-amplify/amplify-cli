"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthResourceName = void 0;
const getAuthResourceName = async (context) => {
    const { allResources } = await context.amplify.getResourceStatus();
    const authResource = allResources.filter((resource) => resource.service === 'Cognito');
    let authResourceName;
    if (authResource.length > 0) {
        const resource = authResource[0];
        authResourceName = resource.resourceName;
    }
    else {
        throw new Error('Cognito UserPool does not exists');
    }
    return authResourceName;
};
exports.getAuthResourceName = getAuthResourceName;
//# sourceMappingURL=getAuthResourceName.js.map