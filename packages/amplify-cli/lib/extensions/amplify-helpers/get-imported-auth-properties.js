"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImportedAuthProperties = void 0;
const lodash_1 = __importDefault(require("lodash"));
const getImportedAuthProperties = (context) => {
    const { amplifyMeta } = context.amplify.getProjectDetails();
    const authCategoryName = 'auth';
    const authServiceName = 'Cognito';
    const authCategory = lodash_1.default.get(amplifyMeta, [authCategoryName], undefined);
    if (authCategory) {
        const importedAuthResources = Object.entries(authCategory).filter((entry) => entry[1].service === authServiceName && entry[1].serviceType === 'imported');
        if (importedAuthResources.length === 1) {
            const authResource = importedAuthResources[0];
            const resourceName = authResource[0];
            const envSpecificParameters = context.amplify.loadEnvResourceParameters(context, authCategoryName, resourceName);
            if (envSpecificParameters &&
                envSpecificParameters.userPoolId &&
                (!envSpecificParameters.identityPoolId ||
                    (!!envSpecificParameters.identityPoolId &&
                        envSpecificParameters.authRoleArn &&
                        envSpecificParameters.authRoleName &&
                        envSpecificParameters.unauthRoleArn &&
                        envSpecificParameters.unauthRoleName))) {
                return {
                    imported: true,
                    userPoolId: envSpecificParameters.userPoolId,
                    authRoleArn: envSpecificParameters.authRoleArn,
                    authRoleName: envSpecificParameters.authRoleName,
                    unauthRoleArn: envSpecificParameters.unauthRoleArn,
                    unauthRoleName: envSpecificParameters.unauthRoleName,
                };
            }
        }
    }
    return {
        imported: false,
    };
};
exports.getImportedAuthProperties = getImportedAuthProperties;
//# sourceMappingURL=get-imported-auth-properties.js.map