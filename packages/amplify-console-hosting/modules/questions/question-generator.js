const constants = require('../../constants/question-constants');
const inquirer = require('inquirer');
const pluginConstants = require('../../constants/plugin-constants');

async function askDeployType() {
  const { anwser } = await inquirer.prompt([
    {
      type: 'list',
      name: 'anwser',
      message: constants.DEPLOY_TYPE_QUESTION,
      choices: [
        constants.DEPLOY_TYPE_QUESTION_CICD,
        constants.DEPLOY_TYPE_QUESTION_MANUAL,
        constants.LEARN_MORE,
      ],
      default: constants.DEPLOY_TYPE_QUESTION_MANUAL,
    },
  ]);
  switch (anwser) {
    case constants.DEPLOY_TYPE_QUESTION_MANUAL:
      return pluginConstants.TYPE_MANUAL;
    case constants.DEPLOY_TYPE_QUESTION_CICD:
      return pluginConstants.TYPE_CICD;
    case constants.LEARN_MORE:
      return pluginConstants.TYPE_HELP;
    default:
      throw new Error(pluginConstants.ILLEGAL_ARGUMENT_ERROR);
  }
}

async function askCICDConfirmQuestion() {
  return askInputQuestion(constants.CICD_CONFIRM_QUESTION);
}

async function askViewAppQuestion() {
  return askConfirmQuestion(constants.VIEW_APP_QUESTION);
}

async function askServeQuestion(type) {
  if (type === constants.TYPE_CICD) {
    return askConfirmQuestion(constants.APP_CICD_SERVE_QUESTION);
  }
  return askConfirmQuestion(constants.APP_MANUAL_SERVE_QUESTION);
}

async function askConfigureAppQuestion() {
  return askConfirmQuestion(constants.APP_CONFIGURE_QUESTION);
}

async function askConfirmQuestion(message) {
  const questionKey = 'question';
  const anwser = await inquirer.prompt([
    {
      type: 'confirm',
      name: questionKey,
      message,
      default: true,
    },
  ]);
  return anwser[questionKey];
}

async function askInputQuestion(message) {
  const questionKey = 'question';
  const anwser = await inquirer.prompt([
    {
      type: 'input',
      name: questionKey,
      message,
    },
  ]);
  return anwser[questionKey];
}

module.exports = {
  askDeployType,
  askViewAppQuestion,
  askCICDConfirmQuestion,
  askConfigureAppQuestion,
  askServeQuestion,
};
