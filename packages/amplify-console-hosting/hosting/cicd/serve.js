const open = require('open');
const utils = require('../../utils/amplify-context-utils');
const questions = require('../../modules/questions/question-generator');
const constants = require('../../constants/plugin-constants');

async function serve(context) {
  const region = utils.getRegionForCurrEnv(context);
  const appId = utils.getAppIdForCurrEnv(context);
  if (await questions.askServeQuestion(constants.TYPE_CICD)) {
    await open(`https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${appId}`);
  }
}

module.exports = {
  serve,
};
