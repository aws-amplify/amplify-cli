const initializer = require('./lib/initializer');
const resourcePusher = require('./lib/push-resources');
const providerUtils = require('./lib/utility-functions');
const constants = require('./lib/constants');
const configManager = require('./lib/configuration-manager');
const { setupNewUser } = require('./lib/setup-new-user');

function init(context) {
  return initializer.run(context);
}

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);
}

function pushResources(context, category, resourceName) {
  return resourcePusher.run(context, category, resourceName);
}

function configure(context){
  return configManager.configure(context);
}

module.exports = {
  init,
  onInitSuccessful,
  configure,
  constants,
  pushResources,
  providerUtils,
  setupNewUser, 
};
