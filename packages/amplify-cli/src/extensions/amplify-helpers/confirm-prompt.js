const inquirer = require('inquirer');

async function confirmPrompt(message) {
  const ans = await inquirer.prompt({
    name: 'yesno',
    message,
    type: 'confirm',
  });
  return ans.yesno;
}

module.exports = {
  confirmPrompt,
};
