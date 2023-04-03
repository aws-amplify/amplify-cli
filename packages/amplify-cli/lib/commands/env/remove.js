"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const ora_1 = __importDefault(require("ora"));
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const delete_project_1 = require("../../extensions/amplify-helpers/delete-project");
const remove_env_from_cloud_1 = require("../../extensions/amplify-helpers/remove-env-from-cloud");
const invoke_delete_env_params_1 = require("../../extensions/amplify-helpers/invoke-delete-env-params");
const run = async (context) => {
    const envName = context.parameters.first;
    const currentEnv = context.amplify.getEnvInfo().envName;
    const allEnvs = context.amplify.getEnvDetails();
    if (!envName) {
        throw new amplify_cli_core_1.AmplifyError('EnvironmentNameError', {
            message: 'Environment name was not specified.',
            resolution: 'Pass in the name of the environment using the --name flag.',
        });
    }
    if (!allEnvs[envName]) {
        throw new amplify_cli_core_1.AmplifyError('EnvironmentNameError', {
            message: 'Environment name is invalid.',
            resolution: 'Run amplify env list to get a list of valid environments.',
        });
    }
    if (currentEnv === envName) {
        throw new amplify_cli_core_1.AmplifyError('EnvironmentNameError', {
            message: 'You cannot delete your current environment.',
            resolution: 'Switch to another environment before deleting the current environment.',
            details: "If this is your only environment you can use the 'amplify delete' command to delete your project.",
        });
    }
    const confirmation = await (0, delete_project_1.getConfirmation)(context, envName);
    if (confirmation.proceed) {
        const spinner = (0, ora_1.default)('Deleting resources from the cloud. This will take a few minutes.');
        spinner.start();
        try {
            await (0, remove_env_from_cloud_1.removeEnvFromCloud)(context, envName, confirmation.deleteS3);
            await (0, invoke_delete_env_params_1.invokeDeleteEnvParamsFromService)(context, envName);
        }
        catch (ex) {
            spinner.fail(`remove env failed: ${ex.message}`);
            throw ex;
        }
        spinner.succeed('Successfully removed environment from the cloud');
        delete allEnvs[envName];
        amplify_cli_core_1.stateManager.setTeamProviderInfo(undefined, allEnvs);
        const awsInfo = amplify_cli_core_1.stateManager.getLocalAWSInfo();
        if (awsInfo[envName]) {
            delete awsInfo[envName];
            amplify_cli_core_1.stateManager.setLocalAWSInfo(undefined, awsInfo);
        }
        if (amplify_cli_core_1.FeatureFlags.isInitialized()) {
            await amplify_cli_core_1.FeatureFlags.removeFeatureFlagConfiguration(false, [envName]);
        }
        amplify_prompts_1.printer.success('Successfully removed environment from your project locally');
    }
};
exports.run = run;
//# sourceMappingURL=remove.js.map