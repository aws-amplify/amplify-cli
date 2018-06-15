const ora = require('ora');

let spinner;

function run(context) {
  const initializationTasks = [];
  Object.keys(context.initInfo.projectConfig.providers).forEach((providerKey) => {
    const provider = require(context.initInfo.projectConfig.providers[providerKey]);
    initializationTasks.push(provider.init(context));
  });
  spinner = ora('Initializing project in the cloud. This may take a few minutes...').start();

  return Promise.all(initializationTasks)
    .then(() => {
      spinner.succeed('Project initialized in the cloud');
      return context;
    })
    .catch((err) => {
      spinner.fail('There was an issue initializing project in the cloud');
      throw err;
    });
}

module.exports = {
  run,
};
