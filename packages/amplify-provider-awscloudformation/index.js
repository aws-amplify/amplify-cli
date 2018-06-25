const initializer = require('./lib/initializer');
const resourcePusher = require('./lib/push-resources');

function init(context) {
  return initializer.run(context);
}

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);
}

function pushResources(context, category, resourceName) {
  return resourcePusher.run(context, category, resourceName);
}

module.exports = {
  init,
  onInitSuccessful,
  pushResources,
};
