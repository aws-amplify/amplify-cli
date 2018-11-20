const category = 'storage';

async function add(context, providerName, service) {
  const options = {
    service,
    providerPlugin: providerName,
  };
  const providerController = require(`./provider-utils/${providerName}/index`);
  if (!providerController) {
    context.print.error('Provider not configured for this category');
    return;
  }
  return providerController.addResource(context, category, service, options);
}

async function console(context) {
  context.print.info(`to be implemented: ${category} console`);
}

/* TODO: Migration logic for storage out here.

async function migrateResourceFiles(providerName, service, resourceName) {

}

*/


module.exports = {
  add,
  console,
  // migrateResourceFiles,
};
