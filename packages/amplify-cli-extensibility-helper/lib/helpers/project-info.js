"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectInfo = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const getProjectInfo = () => {
    const localEnvInfo = amplify_cli_core_1.stateManager.getLocalEnvInfo();
    const projectConfig = amplify_cli_core_1.stateManager.getProjectConfig();
    const projectInfo = {
        envName: localEnvInfo.envName,
        projectName: projectConfig.projectName,
    };
    return projectInfo;
};
exports.getProjectInfo = getProjectInfo;
//# sourceMappingURL=project-info.js.map