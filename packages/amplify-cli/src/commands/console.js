const inquirer = require('inquirer');

module.exports = {
  name: 'console',
  run: async context => {
    const categoryPlugins = context.amplify.getCategoryPlugins(context);
    const providerPlugins = context.amplify.getProviderPlugins(context);

    const combinedPlugins = { ...categoryPlugins, ...providerPlugins };

    const answer = await inquirer.prompt({
      type: 'list',
      name: 'pluginKey',
      message: 'Please select the category or provider',
      choices: Object.keys(combinedPlugins),
      default: Object.keys(providerPlugins)[0],
    });

    const plugin = require(combinedPlugins[answer.pluginKey]);
    await plugin.console(context);
  },
};
