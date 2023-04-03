"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const constants_1 = require("../../service-utils/constants");
const constants_2 = require("../../constants");
const supportedServices_1 = require("../../supportedServices");
const provider_controllers_1 = require("../../provider-controllers");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
exports.name = 'update';
const run = async (context) => {
    const { amplify } = context;
    try {
        const result = await amplify.serviceSelectionPrompt(context, constants_2.category, supportedServices_1.supportedServices, constants_1.chooseServiceMessageUpdate);
        if (result.providerName !== constants_1.provider) {
            amplify_prompts_1.printer.error(`Provider ${result.providerName} not configured for this category`);
            return undefined;
        }
        return await (0, provider_controllers_1.updateResource)(context, result.service);
    }
    catch (error) {
        if (error.message) {
            amplify_prompts_1.printer.error(error.message);
        }
        amplify_prompts_1.printer.blankLine();
        if (error.stack) {
            amplify_prompts_1.printer.info(error.stack);
        }
        amplify_prompts_1.printer.error('There was an error updating the geo resource');
        void context.usageData.emitError(error);
        process.exitCode = 1;
    }
    return undefined;
};
exports.run = run;
//# sourceMappingURL=update.js.map