"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notify = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const update_notifier_1 = __importDefault(require("update-notifier"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const pkg = amplify_cli_core_1.JSONUtilities.readJson(path_1.default.join(__dirname, '..', 'package.json'));
const notifier = (0, update_notifier_1.default)({ pkg });
const defaultOpts = {
    message: amplify_cli_core_1.isPackaged ? `Update available:\nRun ${chalk_1.default.blueBright('amplify upgrade')} for the latest features and fixes!` : undefined,
};
const notify = (notifyOpts) => {
    notifyOpts = { ...defaultOpts, ...notifyOpts };
    notifier.notify(notifyOpts);
};
exports.notify = notify;
//# sourceMappingURL=version-notifier.js.map