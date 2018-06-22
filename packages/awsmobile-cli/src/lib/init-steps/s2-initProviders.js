const { getProviderPlugins } = require('../../extensions/awsmobile-helpers/get-provider-plugins');

function run(context) {
  const initializationTasks = [];
  const providers = getProviderPlugins(context); 
  Object.keys(providers).forEach((providerKey) => {
    const provider = require(providers[providerKey]);
    initializationTasks.push(provider.init(context));
  });
  return Promise.all(initializationTasks)
    .then(() => context)
    .catch((err) => {
      throw err;
    });
}

module.exports = {
  run,
};
