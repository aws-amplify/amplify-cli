const initializer = require('./lib/initializer');
const resourcePusher = require('./lib/push-resources');
const projectRemover = require('./lib/delete-project');
const resourceBuilder = require('./lib/build-resources');
const providerUtils = require('./lib/utility-functions');
const constants = require('./lib/constants');
const configManager = require('./lib/configuration-manager');
const setupNewUser = require('./lib/setup-new-user');
const { displayHelpfulURLs } = require('./lib/display-helpful-urls');
const aws = require('./src/aws-utils/aws');
const consoleCommand = require('./lib/console');

function init(context) {
  return initializer.run(context);
}

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);
}

function pushResources(context, category, resourceName) {
  return resourcePusher.run(context, category, resourceName);
}

function deleteProject(context) {
  return projectRemover.run(context);
}

function configure(context) {
  return configManager.configure(context);
}

function buildResources(context, category, resourceName) {
  return resourceBuilder.run(context, category, resourceName);
}

function getConfiguredAWSClient(context) {
  return aws.configureWithCreds(context);
}

function showHelpfulLinks(context, resources) {
  return displayHelpfulURLs(context, resources);
}

function configureNewUser(context) {
  return setupNewUser.run(context);
}

function console(context) {
  return consoleCommand.run(context);
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
  showHelpfulLinks,
  deleteProject,
};
