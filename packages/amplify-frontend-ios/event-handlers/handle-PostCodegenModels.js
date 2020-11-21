const amplifyApp = require('amplify-app');

async function run() {
  await amplifyApp.run({ skipEnvCheck: true });
}

module.exports = {
  run,
};
