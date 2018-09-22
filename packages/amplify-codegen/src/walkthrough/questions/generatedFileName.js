const inquirer = require('inquirer');

const constants = require('../../constants');

const { getOutputFileName } = require('../../utils');

async function askGeneratedFileName(name, target) {
  const answers = await inquirer.prompt([
    {
      name: 'generatedFileName',
      type: 'input',
      message: constants.PROMPT_MSG_FILE_NAME,
      default: getOutputFileName(name, target),
    },
  ]);
  return answers.generatedFileName;
}

module.exports = askGeneratedFileName;
