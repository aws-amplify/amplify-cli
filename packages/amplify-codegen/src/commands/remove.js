const inquirer = require('inquirer');

const loadConfig = require('../codegen-config');
const constants = require('../constants');

async function remove(context) {
  const config = loadConfig(context);
  const projects = config.getProjects();
  let projectName;
  if (projects.length === 0) {
    throw new Error('Codegen is not configured');
  }

  if (projects.length === 1) {
    const [proj] = config.getProjects();
    ({ projectName } = proj);
  } else {
    const choices = projects.map(proj => proj.projectName);
    ({ projectName } = await inquirer.prompt([
      {
        name: 'projectName',
        message: constants.PROMPT_MSG_API_REMOVE,
        type: 'list',
        choices,
      },
    ]));
  }
  config.removeProject(projectName);
  config.save();
}

module.exports = remove;
