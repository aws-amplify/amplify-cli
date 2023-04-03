"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scaffoldProjectHeadless = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("amplify-cli-core");
const git_manager_1 = require("../extensions/amplify-helpers/git-manager");
const scaffoldProjectHeadless = async (context) => {
    const projectPath = process.cwd();
    const { projectName, frontend } = context.exeInfo.projectConfig;
    const skeletonLocalDir = path.join(__dirname, '..', '..', 'templates', 'amplify-skeleton');
    const destFolder = amplify_cli_core_1.pathManager.getAmplifyDirPath(projectPath);
    await fs.ensureDir(destFolder);
    await fs.ensureDir(amplify_cli_core_1.pathManager.getDotConfigDirPath(projectPath));
    const projectConfigFile = amplify_cli_core_1.JSONUtilities.readJson(path.join(skeletonLocalDir, amplify_cli_core_1.PathConstants.DotConfigDirName, `project-config__${frontend}.json`));
    if (!projectConfigFile) {
        throw new amplify_cli_core_1.AmplifyError('ProjectInitError', {
            message: `project-config.json template not found for frontend: ${frontend}`,
            link: 'https://docs.amplify.aws/cli/project/troubleshooting/',
        });
    }
    projectConfigFile.projectName = projectName;
    amplify_cli_core_1.JSONUtilities.writeJson(amplify_cli_core_1.pathManager.getProjectConfigFilePath(projectPath), projectConfigFile);
    await fs.copy(path.join(skeletonLocalDir, amplify_cli_core_1.PathConstants.BackendDirName), amplify_cli_core_1.pathManager.getBackendDirPath(projectPath));
    (0, git_manager_1.insertAmplifyIgnore)(amplify_cli_core_1.pathManager.getGitIgnoreFilePath(projectPath));
    const contextEnvironmentProvider = new amplify_cli_core_1.CLIContextEnvironmentProvider({
        getEnvInfo: () => context.exeInfo.localEnvInfo,
    });
    if (!amplify_cli_core_1.FeatureFlags.isInitialized()) {
        await amplify_cli_core_1.FeatureFlags.initialize(contextEnvironmentProvider, true);
    }
    await amplify_cli_core_1.FeatureFlags.ensureDefaultFeatureFlags(true);
};
exports.scaffoldProjectHeadless = scaffoldProjectHeadless;
//# sourceMappingURL=s8-scaffoldHeadless.js.map