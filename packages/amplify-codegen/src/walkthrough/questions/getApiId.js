const inquirer = require('inquirer');

async function askApiId() {
    const answers = await inquirer.prompt([
      {
        name: 'enteredApiId',
        type: 'input',
        message: 'Enter your apiId',
        default: 'Your apiId here',
      },
    ]);
    return answers.enteredApiId;
  }
  
  module.exports = askApiId;
  