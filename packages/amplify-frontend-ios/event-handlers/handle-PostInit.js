const amplifyApp = require('amplify-app');

async function run(context, args) {
  const { frontend } = context.exeInfo.projectConfig;
  await amplifyApp.run({ skipEnvCheck: true, platform: frontend });
}

module.exports = {
  run,
};
