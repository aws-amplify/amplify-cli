const inquirer = require('inquirer');

const constants = require('../../constants');

async function askAddTypename(defaultAddTypename = false) {
  const answer = await inquirer.prompt([
    {
      name: 'addTypename',
      message: constants.PROMPT_MSG_ADD_TYPENAME,
      type: 'confirm',
      default: defaultAddTypename,
    },
  ]);

  return answer.addTypename;
}

module.exports = askAddTypename;
