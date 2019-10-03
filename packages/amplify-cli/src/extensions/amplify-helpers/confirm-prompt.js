const inquirer = require('inquirer');

async function run(message, defaultValue) {
  const ans = await inquirer.prompt({
    name: 'yesno',
    message,
    type: 'confirm',
    default: defaultValue !== false,

  });
  return ans.yesno;
}

module.exports = {
  run,
};
