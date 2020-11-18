const amplifyApp = require('amplify-app');

async function run(context, args) {
  amplifyApp.run();
}

module.exports = {
  run,
};
