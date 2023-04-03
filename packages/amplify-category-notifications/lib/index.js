"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.handleAmplifyEvent = exports.executeAmplifyCommand = exports.migrate = exports.initEnv = exports.deletePinpointAppForEnv = exports.console = exports.notificationsAPIGetAvailableChannelNames = exports.notificationsPluginAPIRemoveApp = exports.notificationsPluginAPIGetResource = void 0;
const path_1 = __importDefault(require("path"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const pinpointHelper = __importStar(require("./pinpoint-helper"));
const multiEnvManager = __importStar(require("./multi-env-manager"));
const migrations_1 = require("./migrations");
var plugin_provider_api_notifications_1 = require("./plugin-provider-api-notifications");
Object.defineProperty(exports, "notificationsPluginAPIGetResource", { enumerable: true, get: function () { return plugin_provider_api_notifications_1.notificationsPluginAPIGetResource; } });
Object.defineProperty(exports, "notificationsPluginAPIRemoveApp", { enumerable: true, get: function () { return plugin_provider_api_notifications_1.notificationsPluginAPIRemoveApp; } });
Object.defineProperty(exports, "notificationsAPIGetAvailableChannelNames", { enumerable: true, get: function () { return plugin_provider_api_notifications_1.notificationsAPIGetAvailableChannelNames; } });
const category = 'notifications';
const console = async (context) => pinpointHelper.console(context);
exports.console = console;
const deletePinpointAppForEnv = async (context, envName) => {
    await multiEnvManager.deletePinpointAppForEnv(context, envName);
};
exports.deletePinpointAppForEnv = deletePinpointAppForEnv;
const initEnv = async (context) => {
    await multiEnvManager.initEnv(context);
};
exports.initEnv = initEnv;
const migrate = async (context) => {
    await multiEnvManager.migrate(context);
};
exports.migrate = migrate;
const executeAmplifyCommand = async (context) => {
    var _a;
    context.exeInfo = context.amplify.getProjectDetails();
    await (0, migrations_1.migrationCheck)(context);
    let commandPath = path_1.default.normalize(path_1.default.join(__dirname, 'commands'));
    commandPath =
        context.input.command === 'help' ? path_1.default.join(commandPath, category) : path_1.default.join(commandPath, category, context.input.command);
    const commandModule = await (_a = commandPath, Promise.resolve().then(() => __importStar(require(_a))));
    await commandModule.run(context);
};
exports.executeAmplifyCommand = executeAmplifyCommand;
const handleAmplifyEvent = (__context, args) => {
    amplify_prompts_1.printer.info(`${category} handleAmplifyEvent to be implemented`);
    amplify_prompts_1.printer.info(`Received event args ${args}`);
};
exports.handleAmplifyEvent = handleAmplifyEvent;
//# sourceMappingURL=index.js.map