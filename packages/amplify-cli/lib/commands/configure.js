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
exports.run = void 0;
const c0_analyzeProject_1 = require("../config-steps/c0-analyzeProject");
const c1_configFrontend_1 = require("../config-steps/c1-configFrontend");
const c2_configProviders_1 = require("../config-steps/c2-configProviders");
const configure_new_user_1 = require("../configure-new-user");
const c9_onFailure_1 = require("../config-steps/c9-onFailure");
const c9_onSuccess_1 = require("../config-steps/c9-onSuccess");
const input_params_manager_1 = require("../input-params-manager");
const app_config_1 = require("../app-config");
const run = async (context) => {
    var _a;
    if (context.parameters.options['usage-data-off']) {
        (0, app_config_1.write)(context, { usageDataConfig: { isUsageTrackingEnabled: false } });
        context.print.success('Usage Data has been turned off');
        return;
    }
    if (context.parameters.options['usage-data-on']) {
        (0, app_config_1.write)(context, { usageDataConfig: { isUsageTrackingEnabled: true } });
        context.print.success('Usage Data has been turned on');
        return;
    }
    const { appId, envName } = ((_a = context === null || context === void 0 ? void 0 : context.parameters) === null || _a === void 0 ? void 0 : _a.options) || {};
    if (appId && envName) {
        try {
            const providerPlugin = await Promise.resolve().then(() => __importStar(require(context.amplify.getProviderPlugins(context).awscloudformation)));
            await providerPlugin.adminLoginFlow(context, appId, envName);
        }
        catch (e) {
            context.print.error(`Failed to authenticate: ${e.message || 'Unknown error occurred.'}`);
            await context.usageData.emitError(e);
            process.exit(1);
        }
        return;
    }
    if (!context.parameters.first) {
        await (0, configure_new_user_1.configureNewUser)(context);
    }
    if (context.parameters.first === 'project') {
        constructExeInfo(context);
        try {
            await (0, c0_analyzeProject_1.analyzeProject)(context);
            await (0, c1_configFrontend_1.configFrontendHandler)(context);
            await (0, c2_configProviders_1.configProviders)(context);
            await (0, c9_onSuccess_1.onSuccess)(context);
        }
        catch (e) {
            void context.usageData.emitError(e);
            (0, c9_onFailure_1.onFailure)(e);
            process.exitCode = 1;
        }
    }
};
exports.run = run;
function constructExeInfo(context) {
    context.exeInfo = context.amplify.getProjectDetails();
    context.exeInfo.inputParams = (0, input_params_manager_1.normalizeInputParams)(context);
}
//# sourceMappingURL=configure.js.map