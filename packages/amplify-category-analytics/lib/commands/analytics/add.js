"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = exports.run = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const subcommand = 'add';
const category = 'analytics';
let options;
const run = async (context) => {
    const { amplify } = context;
    const servicesMetadata = amplify.readJsonFile(`${__dirname}/../../provider-utils/supported-services.json`);
    return amplify
        .serviceSelectionPrompt(context, category, servicesMetadata, 'Select an Analytics provider')
        .then((result) => {
        options = {
            service: result.service,
            providerPlugin: result.providerName,
        };
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
            amplify_prompts_1.printer.error('Provider not configured for this category');
            return undefined;
        }
        return providerController.addResource(context, category, result.service);
    })
        .then((resourceName) => {
        if (resourceName) {
            amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);
            amplify_prompts_1.printer.success(`Successfully added resource ${resourceName} locally`);
            amplify_prompts_1.printer.info('');
            amplify_prompts_1.printer.success('Some next steps:');
            amplify_prompts_1.printer.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
            amplify_prompts_1.printer.info('"amplify publish" builds all your local backend and front-end resources (if you have hosting category added) and provisions them in the cloud');
            amplify_prompts_1.printer.info('');
        }
    })
        .catch((err) => {
        amplify_prompts_1.printer.info(err.stack);
        amplify_prompts_1.printer.error('There was an error adding the analytics resource');
        void context.usageData.emitError(err);
        process.exitCode = 1;
    });
};
exports.run = run;
exports.name = subcommand;
//# sourceMappingURL=add.js.map