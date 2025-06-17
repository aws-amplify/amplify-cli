const subcommand = 'update';
const category = 'interactions';
const { servicesMetadata } = require(`../../provider-utils/supported-services`);

module.exports = {
  name: subcommand,
  alias: ['configure'],
  run: async (context) => {
    const { amplify } = context;
    context.print
      .warning(`Amazon Lex V1 is reaching end of life on September 15, 2025 and no longer allows creation of new bots as of March 31, 2025. 
      It is recommended that you migrate your bot to Amazon Lex V2 before September 15.`);

    return amplify
      .serviceSelectionPrompt(context, category, servicesMetadata)
      .then((result) => {
        const providerController = require(`../../provider-utils/${result.providerName}/index`);
        if (!providerController) {
          context.print.error('Provider not configured for this category');
          return undefined;
        }
        return providerController.updateResource(context, category, result.service);
      })
      .then(() => context.print.success('Successfully updated resource'))
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error updating the interactions resource');
        context.usageData.emitError(err);
        process.exitCode = 1;
      });
  },
};
