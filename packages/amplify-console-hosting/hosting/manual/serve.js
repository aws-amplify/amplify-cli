const utils = require('../../utils/amplify-context-utils');
const amplifyUtils = require('../../utils/amplify-console-utils');
const { utils: amplifyCoreUtils } = require('amplify-cli-core');

async function serve(context) {
  const appId = utils.getAppIdForCurrEnv(context);
  const env = utils.getCurrEnv(context);
  const amplifyDomain = amplifyUtils.getDefaultDomainForBranch(appId, env);
  await amplifyCoreUtils.openIfNotCI(amplifyDomain);
}

module.exports = {
  serve,
};
