const category = 'storage';

module.exports = {
  add: async (context, providerName, service) => {
    let options = {
      service: service,
      providerPlugin: providerName,
    };
    const providerController = require(`./provider-utils/${providerName}/index`);
    if (!providerController) {
      context.print.error('Provider not confgiured for this category');
      return;
    }
    return providerController.addResource(context, category, service, options);
  }
};