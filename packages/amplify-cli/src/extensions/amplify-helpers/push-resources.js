const ora = require('ora');
const { getProjectConfig } = require('./get-project-config');
const { showResourceTable } = require('./resource-status');
const { onCategoryOutputsChange } = require('./on-category-outputs-change');

const spinner = ora('Updating resources in the cloud. This may take a few minutes...');

async function pushResources(context, category, resourceName) {
  try{
    await showResourceTable(category, resourceName);
  }catch(e){
    console.log(e.stack);
  }

  return context.prompt.confirm('Are you sure you want to continue?')
    .then((answer) => {
      if (answer) {
        const { providers } = getProjectConfig();
        const providerPromises = [];

        Object.keys(providers).forEach((providerName) => {
          const pluginModule = require(providers[providerName]);
          providerPromises.push(pluginModule.pushResources(context, category, resourceName));
        });

        spinner.start();
        return Promise.all(providerPromises);
      }
      process.exit(1);
    })
    .then(() => {
      onCategoryOutputsChange(context);
      spinner.succeed('All resources are updated in the cloud');
    })
    .catch((err) => {
      spinner.fail('An error occurred when pushing the resources to the cloud');
      // Handle the errors and print them nicely for the user.
      context.print.error(`\n${err.message}`);
    });
}

module.exports = {
  pushResources,
};
