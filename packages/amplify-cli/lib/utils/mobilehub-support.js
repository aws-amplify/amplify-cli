"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureMobileHubCommandCompatibility = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const ensureMobileHubCommandCompatibility = (context) => {
    context.projectHasMobileHubResources = false;
    checkIfMobileHubProject(context);
    if (!context.projectHasMobileHubResources) {
        return;
    }
    ensureSupportedCommand(context);
};
exports.ensureMobileHubCommandCompatibility = ensureMobileHubCommandCompatibility;
const checkIfMobileHubProject = (context) => {
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    if (!projectPath) {
        return;
    }
    const meta = amplify_cli_core_1.stateManager.getMeta(projectPath, { throwIfNotExist: false });
    if (!meta) {
        return;
    }
    let hasMigratedResources = false;
    Object.keys(meta)
        .filter((k) => k !== 'providers')
        .forEach((category) => {
        Object.keys(meta[category]).forEach((resourceName) => {
            const resource = meta[category][resourceName];
            if (resource.mobileHubMigrated === true) {
                hasMigratedResources = true;
            }
        });
    });
    context.projectHasMobileHubResources = hasMigratedResources;
};
const ensureSupportedCommand = (context) => {
    const { command } = context.input;
    if (command === 'env') {
        throw new amplify_cli_core_1.AmplifyError('CommandNotSupportedError', {
            message: 'multi-environment support is not available for Amplify projects with Mobile Hub migrated resources.',
            link: 'https://docs.amplify.aws/cli/project/troubleshooting/',
        });
    }
};
//# sourceMappingURL=mobilehub-support.js.map