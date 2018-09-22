const inquirer = require('inquirer');

const constants = require('../../constants');

async function askCodeGenQueryFilePattern(includePattern = ['**/*.graphql']) {
  const answers = await inquirer.prompt([
    {
      name: 'includePattern',
      type: 'input',
      message: constants.PROMPT_MSG_GQL_FILE_PATTERN,
      default: includePattern.join(','),
    },
  ]);
  return answers.includePattern.split(',').map(pattern => pattern.trim());
}

module.exports = askCodeGenQueryFilePattern;
