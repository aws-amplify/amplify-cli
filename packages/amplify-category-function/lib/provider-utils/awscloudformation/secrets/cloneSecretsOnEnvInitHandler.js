"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneSecretsOnEnvInitHandler = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const constants_1 = require("../../../constants");
const secretValuesWalkthrough_1 = require("../service-walkthroughs/secretValuesWalkthrough");
const functionSecretsStateManager_1 = require("./functionSecretsStateManager");
const cloneSecretsOnEnvInitHandler = async (context, sourceEnv, destEnv) => {
    var _a, _b, _c;
    const functionNames = Object.keys((_a = (amplify_cli_core_1.stateManager.getBackendConfig(undefined, { throwIfNotExist: false }) || {})) === null || _a === void 0 ? void 0 : _a[constants_1.categoryName]);
    const functionsWithSecrets = functionNames.filter((name) => !!(0, functionSecretsStateManager_1.getLocalFunctionSecretNames)(name).length);
    if (!functionsWithSecrets.length) {
        return;
    }
    const funcSecretsManager = await functionSecretsStateManager_1.FunctionSecretsStateManager.getInstance(context);
    const cloneDeltas = {};
    for (const funcName of functionsWithSecrets) {
        cloneDeltas[funcName] = await funcSecretsManager.getEnvCloneDeltas(sourceEnv, funcName);
    }
    const funcSecretDeltas = await (0, secretValuesWalkthrough_1.cloneEnvWalkthrough)(!((_c = (_b = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _b === void 0 ? void 0 : _b.inputParams) === null || _c === void 0 ? void 0 : _c.yes), cloneDeltas);
    await Promise.all(Object.entries(funcSecretDeltas).map(async ([funcName, secretDeltas]) => await funcSecretsManager.syncSecretDeltas(secretDeltas, funcName, destEnv)));
};
exports.cloneSecretsOnEnvInitHandler = cloneSecretsOnEnvInitHandler;
//# sourceMappingURL=cloneSecretsOnEnvInitHandler.js.map