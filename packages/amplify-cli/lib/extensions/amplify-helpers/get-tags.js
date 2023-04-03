"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTags = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const getTags = (context) => {
    let tags;
    let envInfo;
    let projectConfig;
    const projectRoot = amplify_cli_core_1.pathManager.findProjectRoot();
    if (amplify_cli_core_1.stateManager.isTagFilePresent(projectRoot)) {
        tags = amplify_cli_core_1.stateManager.getProjectTags(projectRoot);
    }
    else {
        tags = initialTags;
    }
    if (amplify_cli_core_1.stateManager.localEnvInfoExists(projectRoot) && amplify_cli_core_1.stateManager.projectConfigExists(projectRoot)) {
        envInfo = amplify_cli_core_1.stateManager.getLocalEnvInfo(projectRoot);
        projectConfig = amplify_cli_core_1.stateManager.getProjectConfig(projectRoot);
    }
    else {
        envInfo = context.exeInfo.localEnvInfo;
        projectConfig = context.exeInfo.projectConfig;
    }
    const { envName } = envInfo;
    const { projectName } = projectConfig;
    return (0, amplify_cli_core_1.HydrateTags)(tags, { envName, projectName });
};
exports.getTags = getTags;
const initialTags = [
    {
        Key: 'user:Stack',
        Value: '{project-env}',
    },
    {
        Key: 'user:Application',
        Value: '{project-name}',
    },
];
//# sourceMappingURL=get-tags.js.map