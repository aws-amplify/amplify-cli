const inquirer = require('inquirer');

const constants = require('../../constants');

async function askMaxDepth(defaultDepth = 2) {
  const answer = await inquirer.prompt([
    {
      name: 'maxDepth',
      message: constants.PROMPT_MSG_MAX_DEPTH,
      type: 'input',
      validate: val => {
        const num = Number.parseInt(val, 10);
        return Number.isInteger(num) && Number.isFinite(num) && num > 0 ? true : constants.ERROR_MSG_MAX_DEPTH;
      },
      default: defaultDepth,
    },
  ]);

  return Number.parseInt(answer.maxDepth, 10);
}

module.exports = askMaxDepth;
