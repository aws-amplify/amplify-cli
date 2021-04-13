import * as inquirer from 'inquirer';

export async function confirmPrompt(message: string, defaultValue = true) {
  const ans = await inquirer.prompt({
    name: 'yesno',
    message,
    type: 'confirm',
    default: defaultValue,
  });
  return ans.yesno;
}
