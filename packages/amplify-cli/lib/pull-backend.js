"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pullBackend = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const initialize_env_1 = require("./initialize-env");
const amplify_service_helper_1 = require("./amplify-service-helper");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const pullBackend = async (context, inputParams) => {
    context.exeInfo = context.amplify.getProjectDetails();
    context.exeInfo.inputParams = inputParams;
    amplify_prompts_1.printer.info('');
    amplify_prompts_1.printer.info('Pre-pull status:');
    const hasChanges = await context.amplify.showResourceTable();
    amplify_prompts_1.printer.info('');
    context.exeInfo.forcePush = false;
    context.exeInfo.restoreBackend = !context.exeInfo.inputParams.amplify.noOverride;
    if (hasChanges && context.exeInfo.restoreBackend) {
        amplify_prompts_1.printer.warn('Local changes detected.');
        amplify_prompts_1.printer.warn('Pulling changes from the cloud will override your local changes.');
        if (!context.exeInfo.inputParams.yes) {
            const confirmOverride = await context.amplify.confirmPrompt('Are you sure you would like to continue?', false);
            if (!confirmOverride) {
                amplify_prompts_1.printer.info(`Run an 'amplify push' to update your project upstream.`);
                amplify_prompts_1.printer.info('However, this will override upstream changes to this backend environment with your local changes.');
                amplify_prompts_1.printer.info(`To merge local and upstream changes, commit all backend code changes to Git, perform a merge, resolve conflicts, and then run 'amplify push'.`);
                void context.usageData.emitSuccess();
                (0, amplify_cli_core_1.exitOnNextTick)(0);
            }
        }
    }
    await (0, initialize_env_1.initializeEnv)(context);
    ensureBackendConfigFile(context);
    await (0, amplify_service_helper_1.postPullCodegen)(context);
    context.print.info('Post-pull status:');
    await context.amplify.showResourceTable();
    context.print.info('');
};
exports.pullBackend = pullBackend;
const ensureBackendConfigFile = (context) => {
    const { projectPath } = context.exeInfo.localEnvInfo;
    if (!amplify_cli_core_1.stateManager.backendConfigFileExists(projectPath)) {
        amplify_cli_core_1.stateManager.setBackendConfig(projectPath, {});
    }
};
//# sourceMappingURL=pull-backend.js.map