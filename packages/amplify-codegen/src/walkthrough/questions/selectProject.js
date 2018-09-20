const inquirer = require('inquirer');

const { AmplifyCodeGenNoAppSyncAPIAvailableError } = require('../../errors');
const constants = require('../../constants');

async function askForProject(context, projects) {
  if (projects.length === 0) {
    throw new AmplifyCodeGenNoAppSyncAPIAvailableError(constants.ERROR_CODEGEN_NO_API_AVAILABLE);
  }
  if (projects.length === 1) {
    return projects[0].value;
  }
  const answer = await inquirer.prompt([
    {
      name: 'projectName',
      message: constants.PROMPT_MSG_SELECT_PROJECT,
      type: 'list',
      choices: projects,
    },
  ]);
  return answer.projectName;
}

module.exports = askForProject;
