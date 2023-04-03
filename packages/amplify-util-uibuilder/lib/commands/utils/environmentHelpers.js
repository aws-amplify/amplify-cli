"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppId = exports.resolveAppId = exports.getEnvName = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const extractArgs_1 = require("./extractArgs");
const getEnvName = (context, envName) => {
    const args = (0, extractArgs_1.extractArgs)(context);
    return envName || (args === null || args === void 0 ? void 0 : args.environmentName) || context.exeInfo.localEnvInfo.envName;
};
exports.getEnvName = getEnvName;
const resolveAppId = () => {
    var _a, _b;
    const meta = amplify_cli_core_1.stateManager.getMeta();
    return (_b = (_a = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _a === void 0 ? void 0 : _a.awscloudformation) === null || _b === void 0 ? void 0 : _b.AmplifyAppId;
};
exports.resolveAppId = resolveAppId;
const getAppId = (context, appId) => {
    const resolvedAppId = appId || (0, extractArgs_1.extractArgs)(context).appId || (0, exports.resolveAppId)();
    if (!resolvedAppId) {
        throw new Error('Unable to sync Studio components since appId could not be determined. This can happen when you hit the soft limit of number of apps that you can have in Amplify console.');
    }
    return resolvedAppId;
};
exports.getAppId = getAppId;
//# sourceMappingURL=environmentHelpers.js.map