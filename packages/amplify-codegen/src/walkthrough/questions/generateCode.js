const inquirer = require('inquirer');

const constants = require('../../constants');

async function askGenerateCode() {
  const answer = await inquirer.prompt([
    {
      name: 'confirmGenerateCode',
      message: constants.PROMPT_MSG_GENERATE_CODE,
      type: 'confirm',
      default: true,
    },
  ]);

  return answer.confirmGenerateCode;
}

module.exports = askGenerateCode;
