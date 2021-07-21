import { prompter } from './prompter';
import { alphanumeric, and, integer, minLength } from './validators';

const driver = async () => {
  // const result = await prompter.confirmContinue('Do you want to push?');
  // console.log(result);
  const second = await prompter.input('This is a test prompt', {
    validate: and([alphanumeric(), minLength(10)], 'input must be alphanumeric and have length >= 10'),
  });
  console.log(second);
  const third = await prompter.input<number>('This is a number', {
    transform: input => Number.parseInt(input, 10),
    validate: integer(),
    initial: 12,
  });
  console.log(third);
  const options = ['first option', 'second option', 'third option'];
  const fourth = await prompter.pick('pick an option', options);
  console.log(fourth);
};

driver();
