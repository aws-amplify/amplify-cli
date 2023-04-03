"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const supported_services_1 = require("../../provider-utils/supported-services");
const constants_1 = require("../../constants");
exports.name = 'console';
const run = async (context) => {
    const { amplify } = context;
    return amplify.serviceSelectionPrompt(context, constants_1.categoryName, supported_services_1.supportedServices).then(async (result) => {
        const providerController = supported_services_1.supportedServices[result.service].providerController;
        if (!providerController) {
            context.print.error('Provider not configured for this category');
            return;
        }
        await providerController.openConsole(context, result.service);
    });
};
exports.run = run;
//# sourceMappingURL=console.js.map