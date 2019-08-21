const inquirer = require('inquirer');

async function setupProfile() {
  const answer = await inquirer.prompt([{
    type: 'confirm',
    name: 'setupNewUser',
    message: 'Do you want to use an existing AWS profile?',
    default: true,
  }]);
  return answer.setupNewUser;
}

module.exports = setupProfile;
