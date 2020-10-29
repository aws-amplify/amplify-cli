import * as inquirer from 'inquirer';

export async function confirmPrompt(message, defaultValue) {
  const ans = await inquirer.prompt({
    name: 'yesno',
    message,
    type: 'confirm',
    default: defaultValue !== false,
  });
  return ans.yesno;
}
