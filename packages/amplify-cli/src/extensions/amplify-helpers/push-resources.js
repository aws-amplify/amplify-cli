const { getProjectConfig } = require('./get-project-config');
const { showResourceTable } = require('./resource-status');
const { onCategoryOutputsChange } = require('./on-category-outputs-change');

async function pushResources(context, category, resourceName) {
  await showResourceTable(category, resourceName);

  return context.prompt.confirm('Are you sure you want to continue?')
    .then((answer) => {
      if (answer) {
        const { providers } = getProjectConfig();
        const providerPromises = [];

        Object.keys(providers).forEach((providerName) => {
          const pluginModule = require(providers[providerName]);
          providerPromises.push(pluginModule.pushResources(context, category, resourceName));
        });

        return Promise.all(providerPromises);
      }
      process.exit(1);
    })
    .then(() => {
      onCategoryOutputsChange(context);
    })
    .catch((err) => {
      // Handle the errors and print them nicely for the user.
      context.print.error(`\n${err.message}`);
    });
}

module.exports = {
  pushResources,
};
