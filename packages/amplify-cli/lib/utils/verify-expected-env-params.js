"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyExpectedEnvParams = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const build_1 = require("../commands/build");
const verifyExpectedEnvParams = async (context, category, resourceName) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const envParamManager = amplify_cli_core_1.stateManager.localEnvInfoExists()
        ? (await (0, amplify_environment_parameters_1.ensureEnvParamManager)()).instance
        : (await (0, amplify_environment_parameters_1.ensureEnvParamManager)((_c = (_b = (_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.inputParams) === null || _b === void 0 ? void 0 : _b.amplify) === null || _c === void 0 ? void 0 : _c.envName)).instance;
    const downloadHandler = (await context.amplify.invokePluginMethod(context, amplify_cli_core_1.constants.DEFAULT_PROVIDER, undefined, 'getEnvParametersDownloadHandler', [context]));
    await envParamManager.downloadParameters(downloadHandler);
    const getResources = ((_e = (_d = context === null || context === void 0 ? void 0 : context.input) === null || _d === void 0 ? void 0 : _d.options) === null || _e === void 0 ? void 0 : _e.forcePush) === true ? build_1.getAllResources : build_1.getChangedResources;
    const resources = await getResources(context);
    const parametersToCheck = resources.filter(({ category: c, resourceName: r }) => {
        if ((category && c !== category) || (resourceName && r !== resourceName)) {
            return false;
        }
        return true;
    });
    if (((_g = (_f = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _f === void 0 ? void 0 : _f.inputParams) === null || _g === void 0 ? void 0 : _g.yes) || ((_j = (_h = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _h === void 0 ? void 0 : _h.inputParams) === null || _j === void 0 ? void 0 : _j.headless)) {
        await envParamManager.verifyExpectedEnvParameters(parametersToCheck);
    }
    else {
        const missingParameters = await envParamManager.getMissingParameters(parametersToCheck);
        if (missingParameters.length > 0) {
            for (const { categoryName, resourceName, parameterName } of missingParameters) {
                await promptMissingParameter(categoryName, resourceName, parameterName, envParamManager);
            }
            await envParamManager.save();
        }
    }
};
exports.verifyExpectedEnvParams = verifyExpectedEnvParams;
const promptMissingParameter = async (categoryName, resourceName, parameterName, envParamManager) => {
    amplify_prompts_1.printer.warn(`Could not find value for parameter ${parameterName}`);
    const value = await amplify_prompts_1.prompter.input(`Enter a value for ${parameterName} for the ${categoryName} resource: ${resourceName}`);
    const resourceParamManager = envParamManager.getResourceParamManager(categoryName, resourceName);
    resourceParamManager.setParam(parameterName, value);
};
//# sourceMappingURL=verify-expected-env-params.js.map