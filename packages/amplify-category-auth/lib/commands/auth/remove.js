"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const string_maps_1 = require("../../provider-utils/awscloudformation/assets/string-maps");
const auth_input_state_1 = require("../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state");
exports.name = 'remove';
const category = 'auth';
const run = async (context) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;
    const meta = amplify_cli_core_1.stateManager.getMeta();
    throwErrorIfProjectHasAnalytics(meta);
    const hasPossiblyDependentResources = Object.keys(meta).some((categoryName) => ['api', 'storage', 'function'].includes(categoryName) && Object.keys(meta[categoryName]).length > 0);
    if (hasPossiblyDependentResources) {
        amplify_prompts_1.printer.warn(string_maps_1.messages.dependenciesExists);
    }
    const authResourceName = Object.keys(meta.auth).filter((resourceKey) => meta.auth[resourceKey].service === amplify_cli_core_1.AmplifySupportedService.COGNITO);
    try {
        const resource = await amplify.removeResource(context, category, resourceName);
        if ((resource === null || resource === void 0 ? void 0 : resource.service) === amplify_cli_core_1.AmplifySupportedService.COGNITOUSERPOOLGROUPS) {
            const cliState = new auth_input_state_1.AuthInputState(context, authResourceName[0]);
            const cliInputPayload = cliState.getCLIInputPayload();
            cliInputPayload.cognitoConfig.userPoolGroupList = [];
            await cliState.saveCLIInputPayload(cliInputPayload);
        }
    }
    catch (err) {
        amplify_prompts_1.printer.info(err.stack);
        amplify_prompts_1.printer.error('There was an error removing the auth resource');
        void context.usageData.emitError(err);
        process.exitCode = 1;
    }
};
exports.run = run;
const throwErrorIfProjectHasAnalytics = (meta) => {
    const analyticsCategoryMeta = meta[amplify_cli_core_1.AmplifyCategories.ANALYTICS];
    if (!analyticsCategoryMeta)
        return;
    const analyticsResourceNames = Object.keys(analyticsCategoryMeta);
    if (analyticsResourceNames.length === 0)
        return;
    throw new amplify_cli_core_1.AmplifyError('ResourceInUseError', {
        message: 'Auth cannot be removed because the analytics category depends on it',
        resolution: 'Run `amplify remove analytics` first, then retry removing auth',
    });
};
//# sourceMappingURL=remove.js.map