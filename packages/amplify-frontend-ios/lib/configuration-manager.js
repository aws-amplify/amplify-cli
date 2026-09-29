const constants = require('./constants');

function init(context) {
  return Promise.resolve(context);
}

function onInitSuccessful(context) {
  return Promise.resolve(context);
}

function configure(context) {
  return Promise.resolve(context);
}

function displayFrontendDefaults(context) {
  context.print.info(`| App type: ${constants.Label}`);
}

function setFrontendDefaults(context) {
  context.exeInfo.inputParams.amplify.frontend = constants.Label;
}

module.exports = {
  init,
  onInitSuccessful,
  configure,
  displayFrontendDefaults,
  setFrontendDefaults,
};
