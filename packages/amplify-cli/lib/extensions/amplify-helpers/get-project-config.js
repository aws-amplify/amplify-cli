"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectConfig = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
function getProjectConfig() {
    return amplify_cli_core_1.stateManager.getProjectConfig();
}
exports.getProjectConfig = getProjectConfig;
//# sourceMappingURL=get-project-config.js.map