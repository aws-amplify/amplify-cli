const utils = require('../../utils/amplify-context-utils');
const { open } = require('amplify-cli-core');
const questions = require('../../modules/questions/question-generator');

async function publish(context) {
  const region = utils.getRegionForCurrEnv(context);
  const appId = utils.getAppIdForCurrEnv(context);
  if (await questions.askViewAppQuestion()) {
    await open(`https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${appId}`);
  }
}

module.exports = {
  publish,
};
