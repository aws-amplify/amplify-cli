"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkStorageAuthenticationRequirements = exports.migrateAuthDependencyResource = exports.getAuthResourceARN = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const amplify_cli_core_1 = require("amplify-cli-core");
const os_1 = __importDefault(require("os"));
async function getAuthResourceARN(context) {
    let authResources = (await context.amplify.getResourceStatus('auth')).allResources;
    authResources = authResources.filter((resource) => resource.service === 'Cognito');
    if (authResources.length === 0) {
        throw new Error('No auth resource found. Please add it using amplify add auth');
    }
    return authResources[0].resourceName;
}
exports.getAuthResourceARN = getAuthResourceARN;
async function migrateAuthDependencyResource(context) {
    let authResourceName = undefined;
    try {
        authResourceName = await getAuthResourceARN(context);
    }
    catch (error) {
        return true;
    }
    if (authResourceName) {
        return context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.AUTH, undefined, 'migrateAuthResource', [
            context,
            authResourceName,
        ]);
    }
    return true;
}
exports.migrateAuthDependencyResource = migrateAuthDependencyResource;
async function checkStorageAuthenticationRequirements(context, storageResourceName, allowUnauthenticatedIdentities) {
    const storageRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities };
    const checkResult = await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.AUTH, undefined, 'checkRequirements', [
        storageRequirements,
        context,
        'storage',
        storageResourceName,
    ]);
    if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
        throw new Error(checkResult.errors.join(os_1.default.EOL));
    }
    if (checkResult.errors && checkResult.errors.length > 0) {
        amplify_prompts_1.printer.warn(checkResult.errors.join(os_1.default.EOL));
    }
    if (!checkResult.authEnabled || !checkResult.requirementsMet) {
        try {
            if (storageRequirements.allowUnauthenticatedIdentities === undefined) {
                storageRequirements.allowUnauthenticatedIdentities = false;
            }
            await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.AUTH, undefined, 'externalAuthEnable', [
                context,
                amplify_cli_core_1.AmplifyCategories.STORAGE,
                storageResourceName,
                storageRequirements,
            ]);
        }
        catch (error) {
            amplify_prompts_1.printer.error(error);
            throw error;
        }
    }
}
exports.checkStorageAuthenticationRequirements = checkStorageAuthenticationRequirements;
//# sourceMappingURL=s3-auth-api.js.map