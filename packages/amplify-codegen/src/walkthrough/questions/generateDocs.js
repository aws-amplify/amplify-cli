const inquirer = require('inquirer');

const constants = require('../../constants');

async function askGenerateDocs() {
  const answer = await inquirer.prompt([
    {
      name: 'confirmGenerateOperations',
      message: constants.PROMPT_MSG_GENERATE_OPS,
      type: 'confirm',
      default: true,
    },
  ]);

  return answer.confirmGenerateOperations;
}

module.exports = askGenerateDocs;
