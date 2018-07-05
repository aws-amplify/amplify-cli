const initializer = require('./lib/initializer');
const resourcePusher = require('./lib/push-resources');
const resourceBuilder = require('./lib/build-resources');
const providerUtils = require('./lib/utility-functions');
const constants = require('./lib/constants');

function init(context) {
  return initializer.run(context);
}

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);
}

function pushResources(context, category, resourceName) {
  return resourcePusher.run(context, category, resourceName);
}

function buildResources(context, category, resourceName) {
  return resourceBuilder.run(context, category, resourceName);
}

module.exports = {
  init,
  onInitSuccessful,
  constants,
  pushResources,
  buildResources,
  providerUtils,
};
