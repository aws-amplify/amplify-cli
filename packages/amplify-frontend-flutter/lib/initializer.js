const configurationManager = require('./configuration-manager');

function run(context) {
  return configurationManager.init(context);
}

function onInitSuccessful(context) {
  return configurationManager.onInitSuccessful(context);
}

module.exports = {
  run,
  onInitSuccessful,
};
