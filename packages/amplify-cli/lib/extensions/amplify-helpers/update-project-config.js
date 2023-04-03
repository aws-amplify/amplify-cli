"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectConfig = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
function updateProjectConfig(projectPath, label, data) {
    const projectConfig = amplify_cli_core_1.stateManager.getProjectConfig(projectPath, {
        throwIfNotExist: false,
        default: {},
    });
    projectConfig[label] = data;
    amplify_cli_core_1.stateManager.setProjectConfig(projectPath, projectConfig);
}
exports.updateProjectConfig = updateProjectConfig;
//# sourceMappingURL=update-project-config.js.map