const inquirer = require('inquirer');

const constants = require('../../constants');

async function askUpdateDocs() {
  const answer = await inquirer.prompt([
    {
      name: 'confirmUpdateDocs',
      message: constants.PROMPT_MSG_UPDATE_STATEMENTS,
      type: 'confirm',
      default: true,
    },
  ]);

  return answer.confirmUpdateDocs;
}

module.exports = askUpdateDocs;
