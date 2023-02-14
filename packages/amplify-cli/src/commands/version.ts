import { Context } from '../domain/context';
import { byValues, printer, prompter } from 'amplify-prompts';
import { getAmplifyVersion } from '../extensions/amplify-helpers/get-amplify-version';
import inquirer from 'inquirer';

export const run = async (context: Context) => {
  const testMe = await inquirer.prompt({
    name: 'testMe',
    type: 'confirm',
    message: 'Test me?',
  });

  if (testMe.testMe) {
    const answer = await prompter.pick<'many', string>('Pick one or more', ['one', 'two', 'three'], {
      returnSize: 'many',
      pickAtLeast: 1,
      initial: byValues([] as string[]),
    });
    console.log('You selected ' + answer);
  }
  // printer.info(getAmplifyVersion());
};
