"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printSMSSandboxWarning = exports.getPostUpdateAuthMessagePrinter = exports.getPostAddAuthMessagePrinter = void 0;
const os_1 = require("os");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const getPostAddAuthMessagePrinter = (resourceName, skipNextSteps = false) => {
    amplify_prompts_1.printer.success(`Successfully added auth resource ${resourceName} locally`);
    if (!skipNextSteps) {
        printCommonText();
    }
};
exports.getPostAddAuthMessagePrinter = getPostAddAuthMessagePrinter;
const getPostUpdateAuthMessagePrinter = () => (resourceName) => {
    amplify_prompts_1.printer.success(`Successfully updated auth resource ${resourceName} locally`);
    printCommonText();
};
exports.getPostUpdateAuthMessagePrinter = getPostUpdateAuthMessagePrinter;
const printCommonText = () => {
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.success('Some next steps:');
    amplify_prompts_1.printer.info('"amplify push" will build all your local backend resources and provision it in the cloud');
    amplify_prompts_1.printer.info('"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud');
    amplify_prompts_1.printer.blankLine();
};
const printSMSSandboxWarning = async () => {
    const postAddUpdateSMSSandboxInfo = await amplify_cli_core_1.BannerMessage.getMessage('COGNITO_SMS_SANDBOX_CATEGORY_AUTH_ADD_OR_UPDATE_INFO');
    if (postAddUpdateSMSSandboxInfo) {
        amplify_prompts_1.printer.warn(`${postAddUpdateSMSSandboxInfo}${os_1.EOL}`);
    }
};
exports.printSMSSandboxWarning = printSMSSandboxWarning;
//# sourceMappingURL=message-printer.js.map