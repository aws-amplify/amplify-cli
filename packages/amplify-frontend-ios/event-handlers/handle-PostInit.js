const amplifyApp = require('amplify-app');

async function run(context, args) {
  await amplifyApp.run();
}

module.exports = {
  run,
};
