"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alias = exports.name = exports.run = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const subcommand = 'update';
const category = 'analytics';
const run = async (context) => {
    const { amplify } = context;
    const servicesMetadata = amplify.readJsonFile(`${__dirname}/../../provider-utils/supported-services.json`);
    return amplify
        .serviceSelectionPrompt(context, category, servicesMetadata)
        .then((result) => {
        const options = {
            service: result.service,
            providerPlugin: result.providerName,
        };
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
            amplify_prompts_1.printer.error('Provider not configured for this category');
            return undefined;
        }
        return providerController.updateResource(context, category, result.service, options);
    })
        .then((resourceName) => {
        amplify_prompts_1.printer.success(`Successfully updated resource ${resourceName} locally`);
        amplify_prompts_1.printer.info('');
        amplify_prompts_1.printer.success('Some next steps:');
        amplify_prompts_1.printer.info('"amplify push" will build all your local backend resources and provision it in the cloud');
        amplify_prompts_1.printer.info('"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud');
        amplify_prompts_1.printer.info('');
    })
        .catch((err) => {
        amplify_prompts_1.printer.info(err.stack);
        amplify_prompts_1.printer.error(`There was an error updating the ${category} resource`);
        void context.usageData.emitError(err);
        process.exitCode = 1;
    });
};
exports.run = run;
exports.name = subcommand;
exports.alias = ['configure'];
//# sourceMappingURL=update.js.map