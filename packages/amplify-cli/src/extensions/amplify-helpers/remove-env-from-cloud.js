const { getProjectConfig } = require('./get-project-config');
const { getCategoryPlugins } = require('./get-category-plugins');
const { getProviderPlugins } = require('./get-provider-plugins');

async function removeEnvFromCloud(context, envName, deleteS3) {
  const { providers } = getProjectConfig();
  const providerPlugins = getProviderPlugins(context);
  const providerPromises = [];
  context.print.info('');
  context.print.info(`Deleting env:${envName}`);

  providers.forEach(providerName => {
    const pluginModule = require(providerPlugins[providerName]);
    providerPromises.push(pluginModule.deleteEnv(context, envName, deleteS3));
  });

  try {
    await Promise.all(providerPromises);
  } catch (e) {
    context.print.info('');
    context.print.error(`Error in deleting env:${envName}`);
    context.print.info(e.message);
    throw e;
  }

  const categoryPlugins = getCategoryPlugins(context);
  if (categoryPlugins.notifications) {
    const notificationsModule = require(categoryPlugins.notifications);
    await notificationsModule.deletePinpointAppForEnv(context, envName);
  }
}

module.exports = {
  removeEnvFromCloud,
};
