"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForNestedProject = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const checkForNestedProject = () => {
    var _a;
    const projectRoot = (_a = amplify_cli_core_1.pathManager.findProjectRoot()) !== null && _a !== void 0 ? _a : process.cwd();
    if (projectRoot !== process.cwd()) {
        throw new amplify_cli_core_1.AmplifyError('NestedProjectInitError', {
            message: 'Creating a nested amplify project is not supported',
            details: `Project root detected in: ${projectRoot}`,
            resolution: `Rename or move the existing 'amplify' directory from: ${projectRoot}`,
        });
    }
};
exports.checkForNestedProject = checkForNestedProject;
//# sourceMappingURL=projectUtils.js.map