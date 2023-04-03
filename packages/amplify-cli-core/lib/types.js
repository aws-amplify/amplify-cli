"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyFrontend = exports.ManuallyTimedCodePath = exports.UntilExitTimedCodePath = exports.FromStartupTimedCodePaths = void 0;
var FromStartupTimedCodePaths;
(function (FromStartupTimedCodePaths) {
    FromStartupTimedCodePaths["PLATFORM_STARTUP"] = "platformStartup";
    FromStartupTimedCodePaths["TOTAL_DURATION"] = "totalDuration";
})(FromStartupTimedCodePaths = exports.FromStartupTimedCodePaths || (exports.FromStartupTimedCodePaths = {}));
var UntilExitTimedCodePath;
(function (UntilExitTimedCodePath) {
    UntilExitTimedCodePath["POST_PROCESS"] = "postProcess";
})(UntilExitTimedCodePath = exports.UntilExitTimedCodePath || (exports.UntilExitTimedCodePath = {}));
var ManuallyTimedCodePath;
(function (ManuallyTimedCodePath) {
    ManuallyTimedCodePath["PLUGIN_TIME"] = "pluginTime";
    ManuallyTimedCodePath["PUSH_TRANSFORM"] = "pushTransform";
    ManuallyTimedCodePath["PUSH_DEPLOYMENT"] = "pushDeployment";
    ManuallyTimedCodePath["INIT_ENV_PLATFORM"] = "initEnvPlatform";
    ManuallyTimedCodePath["INIT_ENV_CATEGORIES"] = "initEnvCategories";
    ManuallyTimedCodePath["PROMPT_TIME"] = "promptTime";
})(ManuallyTimedCodePath = exports.ManuallyTimedCodePath || (exports.ManuallyTimedCodePath = {}));
var AmplifyFrontend;
(function (AmplifyFrontend) {
    AmplifyFrontend["android"] = "android";
    AmplifyFrontend["ios"] = "ios";
    AmplifyFrontend["javascript"] = "javascript";
})(AmplifyFrontend = exports.AmplifyFrontend || (exports.AmplifyFrontend = {}));
//# sourceMappingURL=types.js.map