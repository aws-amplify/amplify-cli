const inquirer = require('inquirer');

const constants = require('../../constants');

async function askAppSyncAPITarget(context, apis, selectedApi = null) {
  const choices = apis.map(api => ({ name: api.name, value: api.id }));
  if (apis.length === 1) {
    return apis[0].id;
  }

  const answer = await inquirer.prompt([
    {
      name: 'apiId',
      message: constants.PROMPT_MSG_API_LIST,
      type: 'list',
      choices,
      default: selectedApi || null,
    },
  ]);

  return answer.apiId;
}

module.exports = askAppSyncAPITarget;
