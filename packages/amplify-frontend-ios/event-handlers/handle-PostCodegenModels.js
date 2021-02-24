const amplifyApp = require('amplify-app');
const { FeatureFlags } = require('amplify-cli-core');

async function run(context) {
  const frontend = context.amplify.getProjectConfig().frontend;
  const isXcodeIntegrationEnabled = FeatureFlags.getBoolean('frontend-ios.enableXcodeIntegration');
  if (frontend === 'ios' && isXcodeIntegrationEnabled) {
    await amplifyApp.run({ skipEnvCheck: true, platform: frontend, skipInit: true, internalOnlyIosCallback: true });
  }
}

module.exports = {
  run,
};
