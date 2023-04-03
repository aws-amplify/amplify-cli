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
exports.attachUsageData = exports.isHeadlessCommand = exports.constructContext = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const _ = __importStar(require("lodash"));
const app_config_1 = require("./app-config");
const amplify_cli_core_2 = require("amplify-cli-core");
const amplify_usageData_1 = require("./domain/amplify-usageData");
const context_1 = require("./domain/context");
const constructContext = (pluginPlatform, input) => {
    const context = new context_1.Context(pluginPlatform, input);
    (0, amplify_cli_core_2.attachExtensions)(context);
    return context;
};
exports.constructContext = constructContext;
const isHeadlessCommand = (context) => context.input.options && context.input.options.headless;
exports.isHeadlessCommand = isHeadlessCommand;
const attachUsageData = async (context, processStartTimeStamp) => {
    const { AMPLIFY_CLI_ENABLE_USAGE_DATA } = process.env;
    const config = (0, app_config_1.init)(context);
    const usageTrackingEnabled = AMPLIFY_CLI_ENABLE_USAGE_DATA
        ? AMPLIFY_CLI_ENABLE_USAGE_DATA === 'true'
        : config.usageDataConfig.isUsageTrackingEnabled;
    if (usageTrackingEnabled) {
        context.usageData = amplify_usageData_1.UsageData.Instance;
        context.usageData.setIsHeadless((0, exports.isHeadlessCommand)(context));
    }
    else {
        context.usageData = amplify_usageData_1.NoUsageData.Instance;
        context.usageData.setIsHeadless((0, exports.isHeadlessCommand)(context));
    }
    const accountId = getSafeAccountId();
    context.usageData.init(config.usageDataConfig.installationUuid, getVersion(context), context.input, accountId, getProjectSettings(), processStartTimeStamp);
};
exports.attachUsageData = attachUsageData;
const getSafeAccountId = () => {
    const emptyString = '';
    if (!amplify_cli_core_1.stateManager.metaFileExists()) {
        return emptyString;
    }
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const stackId = _.get(amplifyMeta, ['providers', 'awscloudformation', 'StackId']);
    if (!stackId) {
        return emptyString;
    }
    const splitString = stackId.split(':');
    if (splitString.length > 4) {
        return splitString[4];
    }
    return emptyString;
};
const getVersion = (context) => context.pluginPlatform.plugins.core[0].packageVersion;
const getProjectSettings = () => {
    var _a;
    const projectSettings = {};
    if (amplify_cli_core_1.stateManager.projectConfigExists()) {
        const projectConfig = amplify_cli_core_1.stateManager.getProjectConfig();
        const { frontend } = projectConfig;
        projectSettings.frontend = frontend;
        projectSettings.framework = (_a = projectConfig === null || projectConfig === void 0 ? void 0 : projectConfig[frontend]) === null || _a === void 0 ? void 0 : _a.framework;
    }
    if (amplify_cli_core_1.stateManager.localEnvInfoExists()) {
        const { defaultEditor } = amplify_cli_core_1.stateManager.getLocalEnvInfo();
        projectSettings.editor = defaultEditor;
    }
    return projectSettings;
};
//# sourceMappingURL=context-manager.js.map