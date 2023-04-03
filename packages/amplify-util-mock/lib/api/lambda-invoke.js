"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLambdaTrigger = exports.invokeTrigger = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const load_lambda_config_1 = require("../utils/lambda/load-lambda-config");
const amplify_function_plugin_interface_1 = require("@aws-amplify/amplify-function-plugin-interface");
const amplify_category_function_1 = require("@aws-amplify/amplify-category-function");
const func_1 = require("../func");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const invokeTrigger = async (context, trigger, data) => {
    var _a, _b, _c, _d, _e, _f, _g;
    let invoker;
    if (trigger === null || trigger === void 0 ? void 0 : trigger.name) {
        const functionName = trigger.name;
        const lambdaConfig = await (0, load_lambda_config_1.loadLambdaConfig)(context, functionName, true);
        if (!(lambdaConfig === null || lambdaConfig === void 0 ? void 0 : lambdaConfig.handler)) {
            throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
                message: `Could not parse handler for ${functionName} from cloudformation file`,
                link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
            });
        }
        await (0, amplify_category_function_1.getBuilder)(context, functionName, amplify_function_plugin_interface_1.BuildType.DEV)();
        invoker = await (0, amplify_category_function_1.getInvoker)(context, { resourceName: functionName, handler: lambdaConfig.handler, envVars: lambdaConfig.environment });
    }
    else {
        const envVars = ((_a = trigger === null || trigger === void 0 ? void 0 : trigger.config) === null || _a === void 0 ? void 0 : _a.envVars) || {};
        if (!((_b = trigger === null || trigger === void 0 ? void 0 : trigger.config) === null || _b === void 0 ? void 0 : _b.runtimePluginId) || !((_c = trigger === null || trigger === void 0 ? void 0 : trigger.config) === null || _c === void 0 ? void 0 : _c.handler) || !((_d = trigger === null || trigger === void 0 ? void 0 : trigger.config) === null || _d === void 0 ? void 0 : _d.runtime) || !((_e = trigger === null || trigger === void 0 ? void 0 : trigger.config) === null || _e === void 0 ? void 0 : _e.directory)) {
            throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
                message: `Could not parse lambda config for non-function category trigger`,
                link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
            });
        }
        const runtimeManager = await context.amplify.loadRuntimePlugin(context, trigger.config.runtimePluginId);
        if ((_f = trigger === null || trigger === void 0 ? void 0 : trigger.config) === null || _f === void 0 ? void 0 : _f.reBuild) {
            await (0, exports.buildLambdaTrigger)(runtimeManager, trigger.config);
        }
        invoker = ({ event }) => runtimeManager.invoke({
            handler: trigger.config.handler,
            event: JSON.stringify(event),
            runtime: trigger.config.runtime,
            srcRoot: trigger.config.directory,
            envVars,
        });
    }
    amplify_prompts_1.printer.info('Starting execution...');
    try {
        const result = await (0, func_1.timeConstrainedInvoker)(invoker({ event: data }), (_g = context === null || context === void 0 ? void 0 : context.input) === null || _g === void 0 ? void 0 : _g.options);
        const stringResult = stringifyResult(result);
        amplify_prompts_1.printer.success('Result:');
        amplify_prompts_1.printer.info(stringResult);
    }
    catch (err) {
        amplify_prompts_1.printer.error(`Lambda trigger failed with the following error:`);
        amplify_prompts_1.printer.info(err);
    }
    finally {
        amplify_prompts_1.printer.info('Finished execution.');
    }
};
exports.invokeTrigger = invokeTrigger;
const stringifyResult = (result) => {
    return typeof result === 'object' ? JSON.stringify(result, undefined, 2) : typeof result === 'undefined' ? '' : result;
};
const buildLambdaTrigger = async (runtimeManager, triggerConfig) => {
    const runtimeRequirementsCheck = await runtimeManager.checkDependencies(triggerConfig === null || triggerConfig === void 0 ? void 0 : triggerConfig.runtime);
    if (!(runtimeRequirementsCheck === null || runtimeRequirementsCheck === void 0 ? void 0 : runtimeRequirementsCheck.hasRequiredDependencies)) {
        const runtimeRequirementsError = 'Required dependencies to build the lambda trigger are missing';
        amplify_prompts_1.printer.error((runtimeRequirementsCheck === null || runtimeRequirementsCheck === void 0 ? void 0 : runtimeRequirementsCheck.errorMessage) || runtimeRequirementsError);
        throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
            message: runtimeRequirementsError,
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    const buildRequest = {
        buildType: amplify_function_plugin_interface_1.BuildType.DEV,
        srcRoot: triggerConfig === null || triggerConfig === void 0 ? void 0 : triggerConfig.directory,
        runtime: triggerConfig === null || triggerConfig === void 0 ? void 0 : triggerConfig.runtime,
    };
    await runtimeManager.build(buildRequest);
};
exports.buildLambdaTrigger = buildLambdaTrigger;
//# sourceMappingURL=lambda-invoke.js.map