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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const win_utils_1 = require("../utils/win-utils");
const win_constants_1 = require("../utils/win-constants");
const hidefile_1 = require("hidefile");
const chalk_1 = __importDefault(require("chalk"));
const run = async (context) => {
    var _a, _b;
    if (!amplify_cli_core_1.isPackaged) {
        context.print.warning('"uninstall" is not available in this installation of Amplify.');
        context.print.info(`Use ${chalk_1.default.blueBright('npm uninstall -g @aws-amplify/cli')} instead.`);
        return;
    }
    if (!((_b = (_a = context === null || context === void 0 ? void 0 : context.input) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b.yes) &&
        !(await context.amplify.confirmPrompt('Are you sure you want to uninstall the Amplify CLI?', false))) {
        context.print.warning('Not removing the Amplify CLI.');
        return;
    }
    if (process.platform.startsWith('win')) {
        const binPath = path.join(amplify_cli_core_1.pathManager.getHomeDotAmplifyDirPath(), 'bin', 'amplify.exe');
        try {
            await fs.move(binPath, win_constants_1.pendingDeletePath, { overwrite: true });
        }
        catch (err) {
            throw new Error(`Unable to move binary out of .amplify directory. You can manually remove [${amplify_cli_core_1.pathManager.getHomeDotAmplifyDirPath()}]`);
        }
        try {
            (0, hidefile_1.hideSync)(win_constants_1.pendingDeletePath);
        }
        catch (err) {
        }
        try {
            await (0, win_utils_1.setRegPendingDelete)();
        }
        catch (err) {
            context.print.warning(err);
            context.print.warning(`Unable to set registry value marking Amplify binary for deletion. You can manually delete ${win_constants_1.pendingDeletePath}.`);
        }
    }
    await removeHomeDotAmplifyDir();
    context.print.success('Uninstalled the Amplify CLI');
};
exports.run = run;
const removeHomeDotAmplifyDir = async () => {
    try {
        await fs.remove(amplify_cli_core_1.pathManager.getHomeDotAmplifyDirPath());
    }
    catch (ex) {
        throw new Error(`Failed to remove [${amplify_cli_core_1.pathManager.getHomeDotAmplifyDirPath()}]\nYou'll need to manually remove this directory.`);
    }
};
//# sourceMappingURL=uninstall.js.map