const utils = require('../../utils/amplify-context-utils');
const { utils: amplifyUtils } = require('amplify-cli-core');
const questions = require('../../modules/questions/question-generator');

async function configure(context) {
  const region = utils.getRegionForCurrEnv(context);
  const appId = utils.getAppIdForCurrEnv(context);
  const env = utils.getCurrEnv(context);
  if (await questions.askConfigureAppQuestion()) {
    await amplifyUtils.openIfNotCI(`https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${appId}/${env}`);
  }
}

module.exports = {
  configure,
};
