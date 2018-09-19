const inquirer = require('inquirer');

const constants = require('../../constants');
const { AmplifyCodeGenNotSupportedError } = require('../../errors');
const { getFrontEndHandler } = require('../../utils');

const frontEndToTargetMappings = {
  ios: ['swift'],
  javascript: ['typescript', 'flow'],
};
async function askCodeGenTargetLanguage(context, target) {
  const frontend = getFrontEndHandler(context);

  const targetMapping = frontEndToTargetMappings[frontend];
  if (!targetMapping || !targetMapping.length) {
    throw new AmplifyCodeGenNotSupportedError(`${frontend} ${constants.ERROR_CODEGEN_TARGET_NOT_SUPPORTED}`);
  }

  if (targetMapping.length === 1) {
    return targetMapping[0];
  }

  const answer = await inquirer.prompt([
    {
      name: 'target',
      type: 'list',
      message: constants.PROMPT_MSG_CODEGEN_TARGET,
      choices: targetMapping,
      default: target || null,
    },
  ]);
  return answer.target;
}

module.exports = askCodeGenTargetLanguage;
