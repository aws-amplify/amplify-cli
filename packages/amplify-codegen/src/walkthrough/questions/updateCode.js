const inquirer = require('inquirer');

const constants = require('../../constants');

async function askUpdateCode() {
  const answer = await inquirer.prompt([
    {
      name: 'confirmUpdateCode',
      message: constants.PROMPT_MSG_UPDATE_CODE,
      type: 'confirm',
      default: true,
    },
  ]);

  return answer.confirmUpdateCode;
}

module.exports = askUpdateCode;
