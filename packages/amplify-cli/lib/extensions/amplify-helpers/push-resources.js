"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushResources = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_category_custom_1 = require("@aws-amplify/amplify-category-custom");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const build_1 = require("../../commands/build");
const initialize_env_1 = require("../../initialize-env");
const get_env_info_1 = require("./get-env-info");
const get_project_config_1 = require("./get-project-config");
const get_provider_plugins_1 = require("./get-provider-plugins");
const on_category_outputs_change_1 = require("./on-category-outputs-change");
const resource_status_1 = require("./resource-status");
const apply_auth_mode_1 = require("./apply-auth-mode");
const auto_updates_1 = require("./auto-updates");
const verify_expected_env_params_1 = require("../../utils/verify-expected-env-params");
const pushResources = async (context, category, resourceName, filteredResources, rebuild = false) => {
    var _a, _b, _c, _d, _e;
    context.usageData.startCodePathTimer(amplify_cli_core_1.ManuallyTimedCodePath.PUSH_TRANSFORM);
    if ((_a = context.parameters.options) === null || _a === void 0 ? void 0 : _a['iterative-rollback']) {
        if ((_b = context.parameters.options) === null || _b === void 0 ? void 0 : _b.force) {
            throw new amplify_cli_core_1.AmplifyError('CommandNotSupportedError', {
                message: '--iterative-rollback and --force are not supported together',
                resolution: 'Use --force without --iterative-rollback to iteratively rollback and redeploy.',
            });
        }
        context.exeInfo.iterativeRollback = true;
    }
    if ((_c = context.parameters.options) === null || _c === void 0 ? void 0 : _c.env) {
        const envName = context.parameters.options.env;
        const allEnvs = context.amplify.getAllEnvs();
        if (allEnvs.findIndex((env) => env === envName) !== -1) {
            context.exeInfo = { inputParams: {}, localEnvInfo: {} };
            context.exeInfo.forcePush = false;
            context.exeInfo.projectConfig = amplify_cli_core_1.stateManager.getProjectConfig(undefined, {
                throwIfNotExist: false,
            });
            context.exeInfo.localEnvInfo = (0, get_env_info_1.getEnvInfo)();
            if (context.exeInfo.localEnvInfo.envName !== envName) {
                context.exeInfo.localEnvInfo.envName = envName;
                amplify_cli_core_1.stateManager.setLocalEnvInfo(context.exeInfo.localEnvInfo.projectPath, context.exeInfo.localEnvInfo);
            }
            await (0, initialize_env_1.initializeEnv)(context);
        }
        else {
            throw new amplify_cli_core_1.AmplifyError('EnvironmentNotInitializedError', {
                message: 'Current environment cannot be determined.',
                resolution: `Use 'amplify init' in the root of your app directory to create a new environment.`,
            });
        }
    }
    await (0, amplify_category_custom_1.generateDependentResourcesType)();
    const resourcesToBuild = await (0, build_1.getChangedResources)(context);
    await context.amplify.executeProviderUtils(context, 'awscloudformation', 'buildOverrides', {
        resourcesToBuild,
        forceCompile: true,
    });
    let hasChanges = false;
    if (!rebuild) {
        hasChanges = !!(await (0, resource_status_1.showResourceTable)(category, resourceName, filteredResources));
    }
    if (!hasChanges && !context.exeInfo.forcePush && !rebuild) {
        amplify_prompts_1.printer.info('\nNo changes detected');
        context.usageData.stopCodePathTimer(amplify_cli_core_1.ManuallyTimedCodePath.PUSH_TRANSFORM);
        return false;
    }
    await (0, verify_expected_env_params_1.verifyExpectedEnvParams)(context, category, resourceName);
    let continueToPush = !!((_e = (_d = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _d === void 0 ? void 0 : _d.inputParams) === null || _e === void 0 ? void 0 : _e.yes) || rebuild;
    if (!continueToPush) {
        if (context.exeInfo.iterativeRollback) {
            amplify_prompts_1.printer.info('The CLI will rollback the last known iterative deployment.');
        }
        await (0, auto_updates_1.showBuildDirChangesMessage)();
        continueToPush = await amplify_prompts_1.prompter.yesOrNo('Are you sure you want to continue?');
    }
    if (!continueToPush) {
        (0, amplify_cli_core_1.exitOnNextTick)(1);
    }
    let retryPush;
    do {
        retryPush = false;
        try {
            const currentAmplifyMeta = amplify_cli_core_1.stateManager.getCurrentMeta();
            await providersPush(context, rebuild, category, resourceName, filteredResources);
            await (0, on_category_outputs_change_1.onCategoryOutputsChange)(context, currentAmplifyMeta);
        }
        catch (err) {
            const isAuthError = (0, apply_auth_mode_1.isValidGraphQLAuthError)(err.message);
            if (isAuthError) {
                retryPush = await (0, apply_auth_mode_1.handleValidGraphQLAuthError)(context, err.message);
            }
            if (!retryPush) {
                throw new amplify_cli_core_1.AmplifyFault('PushResourcesFault', {
                    message: err.message,
                    details: err.details,
                    link: isAuthError ? amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url : amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url,
                    resolution: isAuthError
                        ? 'Some @auth rules are defined in the GraphQL schema without enabling the corresponding auth providers. Run `amplify update api` to configure your GraphQL API to include the appropriate auth providers as an authorization mode.'
                        : undefined,
                }, err);
            }
        }
    } while (retryPush);
    return continueToPush;
};
exports.pushResources = pushResources;
const providersPush = async (context, rebuild = false, category, resourceName, filteredResources) => {
    const { providers } = (0, get_project_config_1.getProjectConfig)();
    const providerPlugins = (0, get_provider_plugins_1.getProviderPlugins)(context);
    await Promise.all(providers.map(async (provider) => {
        const providerModule = await Promise.resolve().then(() => __importStar(require(providerPlugins[provider])));
        const resourceDefinition = await context.amplify.getResourceStatus(category, resourceName, provider, filteredResources);
        return await providerModule.pushResources(context, resourceDefinition, rebuild);
    }));
};
//# sourceMappingURL=push-resources.js.map