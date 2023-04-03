"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectMeta = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const getProjectMeta = () => {
    if (!amplify_cli_core_1.stateManager.metaFileExists()) {
        throw (0, amplify_cli_core_1.projectNotInitializedError)();
    }
    return amplify_cli_core_1.stateManager.getMeta();
};
exports.getProjectMeta = getProjectMeta;
//# sourceMappingURL=get-project-meta.js.map