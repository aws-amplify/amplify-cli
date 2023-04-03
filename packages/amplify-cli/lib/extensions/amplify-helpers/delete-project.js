"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfirmation = exports.deleteProject = void 0;
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const remove_env_from_cloud_1 = require("./remove-env-from-cloud");
const get_frontend_plugins_1 = require("./get-frontend-plugins");
const get_plugin_instance_1 = require("./get-plugin-instance");
const get_amplify_appId_1 = require("./get-amplify-appId");
const path_manager_1 = require("./path-manager");
const invoke_delete_env_params_1 = require("../../extensions/amplify-helpers/invoke-delete-env-params");
const deleteProject = async (context) => {
    const confirmation = await (0, exports.getConfirmation)(context);
    if (confirmation.proceed) {
        const allEnvs = context.amplify.getEnvDetails();
        const envNames = Object.keys(allEnvs);
        if (amplify_cli_core_1.FeatureFlags.isInitialized()) {
            await amplify_cli_core_1.FeatureFlags.removeFeatureFlagConfiguration(true, envNames);
        }
        const spinner = (0, ora_1.default)('Deleting resources from the cloud. This will take a few minutes.');
        try {
            spinner.start();
            await Promise.all(Object.keys(allEnvs).map((env) => (0, remove_env_from_cloud_1.removeEnvFromCloud)(context, env, confirmation.deleteS3)));
            const appId = (0, get_amplify_appId_1.getAmplifyAppId)();
            if (confirmation.deleteAmplifyApp && appId) {
                const awsCloudPlugin = (0, get_plugin_instance_1.getPluginInstance)(context, 'awscloudformation');
                const amplifyClient = await awsCloudPlugin.getConfiguredAmplifyClient(context, {});
                const environments = await amplifyBackendEnvironments(amplifyClient, appId);
                if (environments.length === 0) {
                    await amplifyClient.deleteApp({ appId }).promise();
                }
                else {
                    amplify_prompts_1.printer.warn('Amplify App cannot be deleted, other environments still linked to Application');
                }
            }
            await Promise.all(envNames.map((envName) => (0, invoke_delete_env_params_1.invokeDeleteEnvParamsFromService)(context, envName)));
            spinner.succeed('Project deleted in the cloud.');
        }
        catch (ex) {
            if ('name' in ex && ex.name === 'BucketNotFoundError') {
                spinner.succeed('Project already deleted in the cloud.');
            }
            else {
                spinner.fail('Project delete failed.');
                throw new amplify_cli_core_1.AmplifyFault('BackendDeleteFault', {
                    message: 'Project delete failed.',
                    details: ex.message,
                }, ex);
            }
        }
        removeLocalAmplifyDir(context);
    }
};
exports.deleteProject = deleteProject;
const removeLocalAmplifyDir = (context) => {
    const { frontend } = context.amplify.getProjectConfig();
    const frontendPlugins = (0, get_frontend_plugins_1.getFrontendPlugins)(context);
    const frontendPluginModule = require(frontendPlugins[frontend]);
    frontendPluginModule.deleteConfig(context);
    context.filesystem.remove((0, path_manager_1.getAmplifyDirPath)());
    amplify_prompts_1.printer.success('Project deleted locally.');
};
const amplifyBackendEnvironments = async (client, appId) => {
    const data = await client
        .listBackendEnvironments({
        appId,
    })
        .promise();
    return data.backendEnvironments;
};
const getConfirmation = async (context, env) => {
    if (context.input.options && context.input.options.force) {
        return {
            proceed: true,
            deleteS3: true,
            deleteAmplifyApp: !process.env.CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_DELETION,
        };
    }
    const environmentText = env ? `'${env}' environment` : 'all the environments';
    return {
        proceed: await amplify_prompts_1.prompter.yesOrNo(chalk_1.default.red(`Are you sure you want to continue? This CANNOT be undone. (This will delete ${environmentText} of the project from the cloud${env ? '' : ' and wipe out all the local files created by Amplify CLI'})`), false),
        deleteS3: true,
        deleteAmplifyApp: true,
    };
};
exports.getConfirmation = getConfirmation;
//# sourceMappingURL=delete-project.js.map