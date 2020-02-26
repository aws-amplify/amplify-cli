const open = require('open');
const utils = require('../../utils/amplify-context-utils');
const amplifyUtils = require('../../utils/amplify-console-utils');
const questions = require('../../modules/questions/question-generator');
const constants = require('../../constants/plugin-constants');


async function serve(context) {
  const appId = utils.getAppIdForCurrEnv(context);
  const env = utils.getCurrEnv(context);
  const amplifyDomain = amplifyUtils.getDefaultDomainForBranch(appId, env);
  if (await questions.askServeQuestion(constants.TYPE_MANUAL)) {
    await open(amplifyDomain);
  }
}

module.exports = {
  serve,
};
