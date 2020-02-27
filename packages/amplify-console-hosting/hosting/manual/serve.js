const open = require('open');
const utils = require('../../utils/amplify-context-utils');
const amplifyUtils = require('../../utils/amplify-console-utils');

async function serve(context) {
  const appId = utils.getAppIdForCurrEnv(context);
  const env = utils.getCurrEnv(context);
  const amplifyDomain = amplifyUtils.getDefaultDomainForBranch(appId, env);
  await open(amplifyDomain);
}

module.exports = {
  serve,
};
