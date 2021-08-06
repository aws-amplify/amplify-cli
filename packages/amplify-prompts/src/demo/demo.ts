import { printer } from '../printer';
import { prompter } from '../prompter';
import { alphanumeric, and, integer, minLength } from '../validators';

const printResult = (result: any) => console.log(`Prommpt result was [${result}]`);
const printTypeofResult = (result: any) => console.log(`Response type was [${typeof result}]`);

/**
 * The following is meant to be a runnable example of functionality offered by amplify-prommpts
 * Run `yarn demo` to see it in action
 */
const demo = async () => {
  // confirmContinue
  printer.info(
    'confirmContine is intended to be used anywhere the CLI is doing a potentially dangerous or destructive action and we want the customer to confirm their understanding.',
  );
  printResult(await prompter.confirmContinue());
  printer.info('A custom prompt can also be used');
  printResult(await prompter.confirmContinue('This will melt your laptop. Proceed?'));

  // yesOrNo
  printer.blankLine();
  printer.info(
    'yesOrNo is similar to confirmContinue but it should be used when we simply want to know whether or not to perform an optional task.',
  );
  printer.info('A message must be specified for this prompt');
  printResult(await prompter.yesOrNo('Do you want to wait for GME to go to the moon?', false));

  printer.warn(
    'The main difference between yesOrNo and confirmContinue is confirmContinue will always return true when the --yes flag is set but yesOrNo will return the default value',
  );

  // input
  printer.blankLine();
  printer.info('To collect free-form input fromm the customer, use prompter.input');
  printer.info('The simplest case is asking for a string input');
  printResult(await prompter.input("What's your favorite color of Skittle?"));

  printer.info('To get an input type besides a string, specify a transform function');
  const result1 = await prompter.input('How mmany Skittles do you want?', { transform: input => Number.parseInt(input, 10) });
  printResult(result1);
  printTypeofResult(result1);

  printer.info('In the above case, you may want to validate the input before the value is returned');
  printer.info('A validate function can accomplish this');
  printer.info('Try entering a value that is not a number this time');
  printResult(
    await prompter.input<'one', number>('How many Skittles do you want', {
      transform: input => Number.parseInt(input, 10),
      validate: integer(),
    }),
  );
  // note the use of the integer() validator. You can write your own validators or use some common ones found in ../validators.ts

  printer.info('Validators can also be combined using boolean utility functions');
  printResult(
    await prompter.input('This input must be alphanumeric and at least 3 characters', {
      validate: and([alphanumeric(), minLength(3)]),
    }),
  );

  printer.info('An initial value can be specified to a prompt');
  printResult(await prompter.input("What's your favorite Skittle color?", { initial: 'yellow' }));

  printer.info('To enter passwords and other sensitive information, text can be hidden');
  printResult(await prompter.input('Enter your super secret value', { hidden: true }));
  printer.info("Note that the result is printed for demo purposes only. Don't ever actually print sensitive info to the console");

  printer.info('To enter a list of values and have it returned as an array of values, specify a returnSize of "many"');
  const resultInputMany = await prompter.input<'many'>('Enter a list of names for each bag of Skittles', { returnSize: 'many' });
  printResult(resultInputMany);
  printTypeofResult(resultInputMany);
  printer.info(
    'Note that when using a "many" input, the transform and validate functions will be applied to each part of the input, rather than the whole input',
  );

  // pick
  printer.blankLine();
  printer.info('prommpter.pick is used to select one or more items fromm a selection set');
  printer.info('It supports autocomplete of choices automatically');
  const choices1 = ['red', 'yellow', 'green', 'orange', 'purple'];
  printResult(await prompter.pick('Pick your favorite Skittle color', choices1));

  printer.info('To pick a value that is different than the display value, a list of name value pairs can be specified');
  const choices2 = [
    {
      name: 'red',
      value: 1,
    },
    {
      name: 'yellow',
      value: 2,
    },
    {
      name: 'green',
      value: 3,
    },
    {
      name: 'orange',
      value: 4,
    },
    {
      name: 'purple',
      value: 5,
    },
  ];
  // Note: without specifying pick type parameters, TS can infer that the result is either number or number[].
  // Type parameters should be specified to tell TS that the result will be a single number.
  const result2 = await prompter.pick<'one', number>('Pick your favorite Skittle color again', choices2);
  printResult(result2);
  printTypeofResult(result2);

  printer.info('A default selection can be specified by providing the index of the option');
  printResult(
    await prompter.pick<'one', number>('Pick it again, this time with a default value', choices2, { initial: 2 }),
  );

  printer.info('Multiple choices can be selected by specifying multiSelect true');
  printer.info('When multiSelect is on, an array of initial indexes can be specified');
  printResult(
    await prompter.pick<'many', number>('Pick your favorite colors', choices2, { returnSize: 'many', initial: [1, 2] }),
  );

  printer.info('Individual choices can be disabled or have hint text next to them');
  (choices2[1] as any).hint = 'definitely the best';
  (choices2[2] as any).disabled = true;
  printResult(
    await prompter.pick<'many', number>('Pick your favorite Skittle color', choices2, { returnSize: 'many' }),
  );
};

demo();
