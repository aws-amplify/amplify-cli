const amplifyApp = require('amplify-app');
const configurationManager = require('./configuration-manager');

function run(context) {
  return configurationManager.init(context);
}

function onInitSuccessful(context) {
  console.log('amplify-frontend-ios successful');
  // amplifyApp.run();
  return configurationManager.onInitSuccessful(context);
}

module.exports = {
  run,
  onInitSuccessful,
};
