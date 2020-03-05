const open = require('open');
const utils = require('../../utils/amplify-context-utils');
const questions = require('../../modules/questions/question-generator');

async function configure(context) {
  const region = utils.getRegionForCurrEnv(context);
  const appId = utils.getAppIdForCurrEnv(context);
  const env = utils.getCurrEnv(context);
  if (await questions.askConfigureAppQuestion()) {
    await open(`https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${appId}/${env}`);
  }
}

module.exports = {
  configure,
};
