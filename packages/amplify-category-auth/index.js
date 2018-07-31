const category = 'auth';
const fs = require('fs');

let options;

async function add(context) {
  const { amplify } = context;
  const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/provider-utils/supported-services.json`));

  const existingAuth = amplify.getProjectDetails().amplifyMeta.auth || {};

  if (Object.keys(existingAuth).length > 0) {
    return context.print.warning('Auth has already been added to this project.');
  }

  return amplify.serviceSelectionPrompt(context, category, servicesMetadata)
  .then((result) => {
    options = {
      service: result.service,
      providerPlugin: result.providerName,
    };
    const providerController = require(`${__dirname}/provider-utils/${result.providerName}/index`);
    if (!providerController) {
      context.print.error('Provider not configured for this category');
      return;
    }
    return providerController.addResource(context, category, result.service);
  })
  .then((resourceName) => {
    amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);
  })
  .then(() => context.print.success('Successfully added resource'))
  .catch((err) => {
    context.print.info(err.stack);
    context.print.error('There was an error adding the auth resource');
  });
}

async function console(context) {
  context.print.info('to be implemented: ' + category + ' console');
}
 
module.exports = {
  add,
  console
};
