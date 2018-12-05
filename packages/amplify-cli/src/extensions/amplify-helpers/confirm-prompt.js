const inquirer = require('inquirer');

async function run(message) {
  const ans = await inquirer.prompt({
    name: 'yesno',
    message,
    type: 'confirm',
  });
  return ans.yesno;
}

module.exports = {
  run,
};
