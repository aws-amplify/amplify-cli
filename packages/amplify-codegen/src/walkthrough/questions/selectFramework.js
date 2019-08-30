const inquirer = require('inquirer');

async function askForFramework(frameworks) {
  const selectFramework = {
    type: 'list',
    name: 'selectedFramework',
    message: 'What javascript framework are you using',
    choices: frameworks,
    default: 'react',
  };
  const answer = await inquirer.prompt(selectFramework);
  return answer.selectedFramework;
}

module.exports = askForFramework;
