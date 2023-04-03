"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableGuestAuth = void 0;
const os = require('os');
async function enableGuestAuth(context, resourceName, allowUnauthenticatedIdentities) {
    const identifyRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities };
    const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
        identifyRequirements,
        context,
        'predictions',
        resourceName,
    ]);
    if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
        throw new Error(checkResult.errors.join(os.EOL));
    }
    if (checkResult.errors && checkResult.errors.length > 0) {
        context.print.warning(checkResult.errors.join(os.EOL));
    }
    if (!checkResult.authEnabled || !checkResult.requirementsMet) {
        try {
            await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
                context,
                'predictions',
                resourceName,
                identifyRequirements,
            ]);
        }
        catch (error) {
            context.print.error(error);
            throw error;
        }
    }
}
exports.enableGuestAuth = enableGuestAuth;
//# sourceMappingURL=enable-guest-auth.js.map