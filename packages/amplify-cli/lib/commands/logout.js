"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const aws_sdk_1 = require("aws-sdk");
const run = async (context) => {
    const { appId } = context.parameters.options;
    if (!appId || appId === true) {
        amplify_prompts_1.printer.info(`Expected parameters: --appId <appId>`);
        return;
    }
    const amplifyAdminConfig = amplify_cli_core_1.stateManager.getAmplifyAdminConfigEntry(appId);
    if (!amplifyAdminConfig) {
        amplify_prompts_1.printer.info(`No access information found for appId ${appId}`);
        return;
    }
    const useGlobalSignOut = await amplify_prompts_1.prompter.yesOrNo('Do you want to logout from all sessions?');
    if (useGlobalSignOut) {
        const cognitoISP = new aws_sdk_1.CognitoIdentityServiceProvider({ region: amplifyAdminConfig.region });
        try {
            await cognitoISP.globalSignOut(amplifyAdminConfig.accessToken.jwtToken);
            amplify_prompts_1.printer.info('Logged out globally.');
        }
        catch (e) {
            amplify_prompts_1.printer.error(`An error occurred during logout: ${e.message}`);
            return;
        }
    }
    amplify_cli_core_1.stateManager.removeAmplifyAdminConfigEntry(appId);
};
exports.run = run;
//# sourceMappingURL=logout.js.map