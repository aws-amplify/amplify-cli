"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../provider-utils/awscloudformation/utils/constants");
const constants_2 = require("../../constants");
const supported_services_1 = require("../../provider-utils/supported-services");
const subcommand = 'add';
let options;
module.exports = {
    name: subcommand,
    run: async (context) => {
        const { amplify } = context;
        const servicesMetadata = supported_services_1.supportedServices;
        return amplify
            .serviceSelectionPrompt(context, constants_2.categoryName, servicesMetadata, constants_1.chooseServiceMessageAdd)
            .then((result) => {
            options = {
                service: result.service,
                providerPlugin: result.providerName,
                build: true,
            };
            const providerController = servicesMetadata[result.service].providerController;
            if (!providerController) {
                context.print.error('Provider not configured for this category');
                return undefined;
            }
            return providerController.addResource(context, constants_2.categoryName, result.service, options);
        })
            .then(() => {
            context.print.info('');
        })
            .catch((err) => {
            context.print.info(err.stack);
            context.print.error('There was an error adding the function resource');
            context.usageData.emitError(err);
            process.exitCode = 1;
        });
    },
};
//# sourceMappingURL=add.js.map