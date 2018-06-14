function run(context) {
  const initializationTasks = [];
  Object.keys(context.initInfo.projectConfig.providers).forEach((providerKey) => {
    const provider = require(context.initInfo.projectConfig.providers[providerKey]);
    initializationTasks.push(provider.init(context));
  });

  return Promise.all(initializationTasks).then(() => context);
}

module.exports = {
  run,
};
