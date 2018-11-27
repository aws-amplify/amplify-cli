const providerUtils = require('./lib/utility-functions');
const constants = require('./lib/constants');
const setupNewUser = require('./lib/setup-new-user');
const aws = require('./src/aws-utils/aws');
const pinpoint = require('./src/aws-utils/aws-pinpoint');
const { formUserAgentParam } = require('./src/aws-utils/user-agent');

function init(context) {
  return require('./lib/initializer').run(context);
}

function onInitSuccessful(context) {
  return require('./lib/initializer').onInitSuccessful(context);
}

function pushResources(context, category, resourceName) {
  return require('./lib/push-resources').run(context, category, resourceName);
}

function deleteProject(context) {
  return require('./lib/delete-project').run(context);
}

function configure(context) {
  return require('./lib/configuration-manager').configure(context);
}

function buildResources(context, category, resourceName) {
  return require('./lib/build-resources').run(context, category, resourceName);
}

function getConfiguredAWSClient(context, category, action) {
  aws.configureWithCreds(context);
  category = category || 'missing';
  action = action || 'missing';
  const userAgentAction = `${category}:${action[0]}`;
  aws.config.update({
    customUserAgent: formUserAgentParam(context, userAgentAction),
  });
  return aws;
}

function getConfiguredPinpointClient(context) {
  return pinpoint.getConfiguredPinpointClient(context);
}

function getConfiguredAWSClient(context) {
  return require('./src/aws-utils/aws').configureWithCreds(context);
}

function showHelpfulLinks(context, resources) {
  const { displayHelpfulURLs } = require('./lib/display-helpful-urls');
  return displayHelpfulURLs(context, resources);
}

function configureNewUser(context) {
  return setupNewUser.run(context);
}

function console(context) {
  return require('./lib/console').run(context);
}

module.exports = {
  console,
  init,
  onInitSuccessful,
  configure,
  configureNewUser,
  constants,
  pushResources,
  buildResources,
  providerUtils,
  setupNewUser,
  getConfiguredAWSClient,
  getPinpointRegionMapping,
  getConfiguredPinpointClient,
  showHelpfulLinks,
  deleteProject,
};
