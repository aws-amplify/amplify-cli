"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prePushHandler = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const constants_1 = require("../constants");
const functionSecretsStateManager_1 = require("../provider-utils/awscloudformation/secrets/functionSecretsStateManager");
const ensure_lambda_arn_outputs_1 = require("../provider-utils/awscloudformation/utils/ensure-lambda-arn-outputs");
const environmentVariablesHelper_1 = require("../provider-utils/awscloudformation/utils/environmentVariablesHelper");
const prePushHandler = async (context) => {
    await (0, environmentVariablesHelper_1.ensureEnvironmentVariableValues)(context);
    await ensureFunctionSecrets(context);
    await (0, ensure_lambda_arn_outputs_1.ensureLambdaExecutionRoleOutputs)();
};
exports.prePushHandler = prePushHandler;
const ensureFunctionSecrets = async (context) => {
    const backendConfig = amplify_cli_core_1.stateManager.getBackendConfig();
    const functionNames = Object.keys((backendConfig === null || backendConfig === void 0 ? void 0 : backendConfig[constants_1.categoryName]) || {});
    for (const funcName of functionNames) {
        if ((0, functionSecretsStateManager_1.getLocalFunctionSecretNames)(funcName).length > 0) {
            const funcSecretsManager = await functionSecretsStateManager_1.FunctionSecretsStateManager.getInstance(context);
            await funcSecretsManager.ensureNewLocalSecretsSyncedToCloud(funcName);
        }
    }
    await (0, functionSecretsStateManager_1.storeSecretsPendingRemoval)(context, functionNames);
};
//# sourceMappingURL=prePushHandler.js.map