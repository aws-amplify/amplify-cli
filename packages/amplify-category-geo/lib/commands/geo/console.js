"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const provider_controllers_1 = require("../../provider-controllers");
const constants_1 = require("../../constants");
const supportedServices_1 = require("../../supportedServices");
const constants_2 = require("../../service-utils/constants");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
exports.name = 'console';
const run = async (context) => {
    const { amplify } = context;
    const result = await amplify.serviceSelectionPrompt(context, constants_1.category, supportedServices_1.supportedServices);
    if (result.providerName !== constants_2.provider) {
        amplify_prompts_1.printer.error(`Provider ${result.providerName} not configured for this category`);
        return;
    }
    await (0, provider_controllers_1.openConsole)(result.service);
};
exports.run = run;
//# sourceMappingURL=console.js.map