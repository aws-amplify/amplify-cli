"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectDetails = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const get_env_info_1 = require("./get-env-info");
const getProjectDetails = () => {
    const projectConfig = amplify_cli_core_1.stateManager.getProjectConfig();
    let amplifyMeta = {};
    let backendConfig = {};
    if (amplify_cli_core_1.stateManager.metaFileExists()) {
        amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    }
    if (amplify_cli_core_1.stateManager.backendConfigFileExists()) {
        backendConfig = amplify_cli_core_1.stateManager.getBackendConfig();
    }
    const localEnvInfo = (0, get_env_info_1.getEnvInfo)();
    return {
        projectConfig,
        amplifyMeta,
        localEnvInfo,
        backendConfig,
    };
};
exports.getProjectDetails = getProjectDetails;
//# sourceMappingURL=get-project-details.js.map