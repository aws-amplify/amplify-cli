"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldRenderComponents = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const clients_1 = require("../../clients");
const environmentHelpers_1 = require("./environmentHelpers");
const shouldRenderComponents = async (context) => {
    var _a, _b;
    const projectConfig = amplify_cli_core_1.stateManager.getProjectConfig();
    if (process.env.FORCE_RENDER) {
        amplify_prompts_1.printer.debug('Forcing component render since environment variable flag is set.');
        return true;
    }
    if ((_b = (_a = context === null || context === void 0 ? void 0 : context.input) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b['no-codegen']) {
        amplify_prompts_1.printer.debug('Not pulling components because --no-codegen flag is set.');
        return false;
    }
    if (!projectConfig) {
        amplify_prompts_1.printer.debug('Not pulling components because there is no projectConfig set for this project.');
        return false;
    }
    if (!projectConfig.providers.includes('awscloudformation')) {
        amplify_prompts_1.printer.debug('Not pulling components because there is no "awscloudformation" provider.');
        return false;
    }
    if (projectConfig.frontend !== 'javascript') {
        amplify_prompts_1.printer.debug('Not pulling components because this project is not configured as a javascript frontend.');
        return false;
    }
    if (projectConfig.javascript.framework !== 'react') {
        amplify_prompts_1.printer.debug('Not pulling components because this project is not configured with the "react" framework.');
        return false;
    }
    if (!(await clients_1.AmplifyStudioClient.isAmplifyApp(context, (0, environmentHelpers_1.getAppId)(context)))) {
        amplify_prompts_1.printer.debug('Not pulling components because this project is not Amplify Studio enabled.');
        return false;
    }
    return true;
};
exports.shouldRenderComponents = shouldRenderComponents;
//# sourceMappingURL=shouldRenderComponents.js.map