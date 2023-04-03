"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supported_services_1 = require("../../provider-utils/supported-services");
const constants_1 = require("../../provider-utils/awscloudformation/utils/constants");
const constants_2 = require("../../constants");
const determineServiceSelection_1 = require("../../provider-utils/awscloudformation/utils/determineServiceSelection");
const subcommand = 'update';
module.exports = {
    name: subcommand,
    alias: ['configure'],
    run: async (context) => {
        const servicesMetadata = supported_services_1.supportedServices;
        return (0, determineServiceSelection_1.determineServiceSelection)(context, constants_1.chooseServiceMessageUpdate)
            .then((result) => {
            const providerController = servicesMetadata[result.service].providerController;
            if (!providerController) {
                context.print.error('Provider not configured for this category');
                return undefined;
            }
            return providerController.updateResource(context, constants_2.categoryName, result.service);
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
//# sourceMappingURL=update.js.map