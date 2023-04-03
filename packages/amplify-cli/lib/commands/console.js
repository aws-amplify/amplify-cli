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
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const chalk_1 = __importDefault(require("chalk"));
const providerName = 'awscloudformation';
const run = async (context) => {
    var _a, _b;
    let consoleUrl = getDefaultURL();
    try {
        const localEnvInfo = amplify_cli_core_1.stateManager.getLocalEnvInfo(undefined, {
            throwIfNotExist: false,
            default: {},
        });
        const { envName } = localEnvInfo;
        const { Region, AmplifyAppId } = (_b = (_a = amplify_cli_core_1.stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a.providers) === null || _b === void 0 ? void 0 : _b[providerName];
        if (envName && AmplifyAppId) {
            consoleUrl = constructStatusURL(Region, AmplifyAppId, envName);
            const providerPlugin = await Promise.resolve().then(() => __importStar(require(context.amplify.getProviderPlugins(context).awscloudformation)));
            if (await providerPlugin.isAmplifyAdminApp(AmplifyAppId)) {
                const choice = await amplify_prompts_1.prompter.pick('Which site do you want to open?', ['Amplify Studio', 'AWS console']);
                if (choice === 'Amplify Studio') {
                    const baseUrl = providerPlugin.adminBackendMap[Region].amplifyAdminUrl;
                    consoleUrl = constructAdminURL(baseUrl, AmplifyAppId, envName);
                }
            }
        }
    }
    catch (e) {
        amplify_prompts_1.printer.error(e.message);
        void context.usageData.emitError(e);
        process.exitCode = 1;
        return;
    }
    amplify_prompts_1.printer.info(chalk_1.default.green(consoleUrl));
    await (0, amplify_cli_core_1.open)(consoleUrl, { wait: false });
};
exports.run = run;
const constructAdminURL = (baseUrl, appId, envName) => `${baseUrl}/admin/${appId}/${envName}/home`;
const constructStatusURL = (region, appId, envName) => {
    const prodURL = `https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${appId}/YmFja2VuZA/${envName}`;
    return prodURL;
};
const getDefaultURL = () => {
    const prodURL = 'https://console.aws.amazon.com/amplify/home#/create';
    return prodURL;
};
//# sourceMappingURL=console.js.map