const inquirer = require('inquirer');

const constants = require('../../constants');

async function askShouldChangeRegion() {
  const answer = await inquirer.prompt([
    {
      name: 'changeRegion',
      message: constants.PROMPT_MSG_CHANGE_REGION,
      type: 'confirm',
      default: true,
    },
  ]);

  return answer.changeRegion;
}

module.exports = askShouldChangeRegion;
