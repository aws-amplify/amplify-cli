const getFrontendHandler = require('./getFrontEndHandler');

const AMPLIFY_FRONTEND_ANDROID_CONFIG_KEY = 'android';
function getAndroidResDir(context) {
  // XXX: create a util function in CLI core and use it
  const { amplify } = context;
  const frontEndHandler = getFrontendHandler(context);
  if (frontEndHandler !== 'android') {
    throw new Error('Not an android project');
  }
  const config = amplify.getProjectConfig();
  const frontendConfig = config[AMPLIFY_FRONTEND_ANDROID_CONFIG_KEY];
  return frontendConfig.config.ResDir;
}

module.exports = getAndroidResDir;
