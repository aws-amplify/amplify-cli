const inquirer = require('inquirer');

async function askForFrontend(frontends) {
  const selectFrontend = {
    type: 'list',
    name: 'selectedFrontend',
    message: "Choose the type of app that you're building",
    choices: frontends,
    default: 'javascript',
  };
  const answer = await inquirer.prompt(selectFrontend);
  return answer.selectedFrontend;
}

module.exports = askForFrontend;
