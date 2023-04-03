"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeDeleteEnvParamsFromService = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const invokeDeleteEnvParamsFromService = async (context, envName) => {
    const CloudFormationProviderName = amplify_cli_core_1.constants.DEFAULT_PROVIDER;
    await context.amplify.invokePluginMethod(context, CloudFormationProviderName, undefined, 'deleteEnvironmentParametersFromService', [
        context,
        envName,
    ]);
};
exports.invokeDeleteEnvParamsFromService = invokeDeleteEnvParamsFromService;
//# sourceMappingURL=invoke-delete-env-params.js.map