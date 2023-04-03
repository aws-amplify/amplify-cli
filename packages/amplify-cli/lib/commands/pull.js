"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const pull_backend_1 = require("../pull-backend");
const pre_deployment_pull_1 = require("../pre-deployment-pull");
const attach_backend_1 = require("../attach-backend");
const amplify_service_helper_1 = require("../amplify-service-helper");
const checkout_1 = require("./env/checkout");
const get_amplify_appId_1 = require("../extensions/amplify-helpers/get-amplify-appId");
const projectUtils_1 = require("./helpers/projectUtils");
const run = async (context) => {
    const inputParams = (0, amplify_service_helper_1.constructInputParams)(context);
    const projectPath = process.cwd();
    if (inputParams.sandboxId) {
        try {
            await (0, pre_deployment_pull_1.preDeployPullBackend)(context, inputParams.sandboxId);
        }
        catch (e) {
            throw new amplify_cli_core_1.AmplifyFault('UnknownFault', {
                message: `Failed to pull sandbox app.`,
                details: e.message || 'An unknown error occurred.',
            }, e);
        }
        return;
    }
    if (amplify_cli_core_1.stateManager.currentMetaFileExists(projectPath)) {
        const { appId: inputAppId, envName: inputEnvName } = inputParams.amplify;
        const { envName } = amplify_cli_core_1.stateManager.getLocalEnvInfo(projectPath);
        const appId = (0, get_amplify_appId_1.getAmplifyAppId)();
        const localEnvNames = Object.keys(amplify_cli_core_1.stateManager.getLocalAWSInfo(undefined, { throwIfNotExist: false }) || {});
        if (inputAppId && appId && inputAppId !== appId) {
            throw new amplify_cli_core_1.AmplifyError('InvalidAmplifyAppIdError', {
                message: `Amplify appId mismatch.`,
                resolution: `You are currently working in the amplify project with Id ${appId}`,
            });
        }
        else if (!appId) {
            throw new amplify_cli_core_1.AmplifyError('EnvironmentNotInitializedError', {
                message: `Environment '${envName}' not found.`,
                resolution: `Try running "amplify env add" to add a new environment.\nIf this backend already exists, try restoring its definition in your team-provider-info.json file.`,
            });
        }
        if (inputEnvName) {
            if (inputEnvName === envName) {
                await (0, pull_backend_1.pullBackend)(context, inputParams);
            }
            else if (localEnvNames.includes(inputEnvName)) {
                context.parameters.options = {};
                context.parameters.first = inputEnvName;
                await (0, checkout_1.run)(context);
            }
            else {
                inputParams.amplify.appId = inputAppId;
                await (0, attach_backend_1.attachBackend)(context, inputParams);
            }
        }
        else {
            await (0, pull_backend_1.pullBackend)(context, inputParams);
        }
    }
    else {
        (0, projectUtils_1.checkForNestedProject)();
        await (0, attach_backend_1.attachBackend)(context, inputParams);
    }
};
exports.run = run;
//# sourceMappingURL=pull.js.map