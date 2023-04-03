"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyMissingPackages = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const subset_1 = __importDefault(require("semver/ranges/subset"));
const codegen_ui_react_1 = require("@aws-amplify/codegen-ui-react");
const extractArgs_1 = require("./extractArgs");
const getRequiredDependencies = () => new codegen_ui_react_1.ReactRequiredDependencyProvider().getRequiredDependencies();
const notifyMissingPackages = (context) => {
    var _a;
    const args = (0, extractArgs_1.extractArgs)(context);
    const localEnvFilePath = (_a = args.localEnvFilePath) !== null && _a !== void 0 ? _a : amplify_cli_core_1.pathManager.getLocalEnvFilePath();
    if (!fs_extra_1.default.existsSync(localEnvFilePath)) {
        amplify_prompts_1.printer.debug('localEnvFilePath could not be determined - skipping dependency notification.');
        return;
    }
    const localEnvJson = amplify_cli_core_1.JSONUtilities.readJson(localEnvFilePath);
    const packageJsonPath = path_1.default.join(localEnvJson.projectPath, 'package.json');
    if (!fs_extra_1.default.existsSync(packageJsonPath)) {
        amplify_prompts_1.printer.debug('package.json file not found - skipping dependency notification.');
        return;
    }
    const packageJson = amplify_cli_core_1.JSONUtilities.readJson(packageJsonPath);
    getRequiredDependencies().forEach((dependency) => {
        const packageIsInstalled = Object.keys(packageJson.dependencies).includes(dependency.dependencyName);
        if (!packageIsInstalled) {
            amplify_prompts_1.printer.warn(`UIBuilder components require "${dependency.dependencyName}" that is not in your package.json. Run \`npm install "${dependency.dependencyName}@${dependency.supportedSemVerPattern}"\`. ${dependency.reason}`);
        }
        else if (!(0, subset_1.default)(packageJson.dependencies[dependency.dependencyName], dependency.supportedSemVerPattern)) {
            amplify_prompts_1.printer.warn(`UIBuilder components require version "${dependency.supportedSemVerPattern}" of "${dependency.dependencyName}". You currently are on version "${packageJson.dependencies[dependency.dependencyName]}". Run \`npm install "${dependency.dependencyName}@${dependency.supportedSemVerPattern}"\`. ${dependency.reason}`);
        }
    });
};
exports.notifyMissingPackages = notifyMissingPackages;
//# sourceMappingURL=notifyMissingPackages.js.map