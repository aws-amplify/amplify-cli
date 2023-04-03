"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postEnvRemoveHandler = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const functionSecretsStateManager_1 = require("../provider-utils/awscloudformation/secrets/functionSecretsStateManager");
const postEnvRemoveHandler = async (context, envName) => {
    try {
        await removeAllEnvSecrets(context, envName);
    }
    catch (err) {
        amplify_prompts_1.printer.debug(`function category postEnvRemoveHandler failed to run.`);
        amplify_prompts_1.printer.debug(`You may need to manually clean up some function state.`);
        amplify_prompts_1.printer.debug(err);
    }
};
exports.postEnvRemoveHandler = postEnvRemoveHandler;
const removeAllEnvSecrets = async (context, envName) => (await functionSecretsStateManager_1.FunctionSecretsStateManager.getInstance(context)).deleteAllEnvironmentSecrets(envName);
//# sourceMappingURL=postEnvRemoveHandler.js.map