const inquirer = require('inquirer');

async function setupProfile() {
  const answer = await inquirer.prompt([{
    type: 'confirm',
    name: 'setupNewUser',
    message: 'Setup new user',
    default: true,
  }]);
  return answer.setupNewUser;
}

module.exports = setupProfile;
