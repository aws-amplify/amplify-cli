"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvInfo = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const getEnvInfo = () => {
    if (amplify_cli_core_1.stateManager.localEnvInfoExists()) {
        return amplify_cli_core_1.stateManager.getLocalEnvInfo();
    }
    throw new amplify_cli_core_1.AmplifyError('EnvironmentNotInitializedError', {
        message: 'Current environment cannot be determined.',
        resolution: `Use 'amplify init' in the root of your app directory to create a new environment.`,
    });
};
exports.getEnvInfo = getEnvInfo;
//# sourceMappingURL=get-env-info.js.map