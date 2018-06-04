const fs = require('fs');
const subcommand = 'add';
const category = 'storage';
const servicesMetadata = JSON.parse(fs.readFileSync(__dirname + '/../../provider-utils/supported-services.json'));
const providerControllers = require("../../provider-utils/provider-controller-mapping");
var options;

module.exports = {
    name: subcommand,
    run: async (context) => {
        const {awsmobile} = context;

        return awsmobile.serviceSelectionPrompt(context, category, servicesMetadata)
            .then((result) => {
                options = {
                    service: result.service,
                    providerPlugin: result.provider
                };
                let providerController = providerControllers[result.provider];
                return providerController.addResource(context, category, result.service);
            })
            .then((resourceName) => awsmobile.updateAwsMobileMetaAfterResourceAdd(category, resourceName, options))
            .then(() => context.print.success("Successfully added resource"));
    }
}