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
exports.writePluginsJsonFile = exports.readPluginsJsonFile = void 0;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const amplify_cli_core_1 = require("amplify-cli-core");
function readPluginsJsonFile() {
    const pluginsFilePath = getPluginsJsonFilePath();
    return amplify_cli_core_1.JSONUtilities.readJson(pluginsFilePath, {
        throwIfNotExist: false,
    });
}
exports.readPluginsJsonFile = readPluginsJsonFile;
function writePluginsJsonFile(pluginsJson) {
    const systemDotAmplifyDirPath = getSystemDotAmplifyDirPath();
    const pluginsJsonFilePath = path.join(systemDotAmplifyDirPath, getPluginsJsonFileName());
    amplify_cli_core_1.JSONUtilities.writeJson(pluginsJsonFilePath, pluginsJson);
}
exports.writePluginsJsonFile = writePluginsJsonFile;
function getPluginsJsonFilePath() {
    return path.join(getSystemDotAmplifyDirPath(), getPluginsJsonFileName());
}
function getSystemDotAmplifyDirPath() {
    return path.join(os.homedir(), amplify_cli_core_1.constants.DOT_AMPLIFY_DIR_NAME);
}
function getPluginsJsonFileName() {
    let result = amplify_cli_core_1.constants.PLUGINS_FILE_NAME;
    const amplifyExecutableName = path.basename(process.argv[1]);
    if (amplifyExecutableName === 'amplify-dev') {
        result = `${amplifyExecutableName}-${amplify_cli_core_1.constants.PLUGINS_FILE_NAME}`;
    }
    return result;
}
//# sourceMappingURL=access-plugins-file.js.map