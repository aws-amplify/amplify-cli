const inquirer = require('inquirer');
const constants = require('../constants');

module.exports = async (apiKeyObject) => {
  const apiKeyList = [];
  apiKeyObject.apiKeys.forEach(apiKey => apiKeyList.push((apiKey.id)));

  if (apiKeyList.length === 0) {
    throw new Error(constants.ERROR_CODEGEN_NO_API_KEY_AVAILABLE);
  }

  if (apiKeyList.length === 1) {
    return apiKeyList[0];
  }

  const answer = await inquirer.prompt([
    {
      name: 'apiKey',
      type: 'list',
      message: constants.PROMPT_MSG_API_KEY,
      choices: apiKeyList,
    },
  ]);

  return answer.apiKey;
};
