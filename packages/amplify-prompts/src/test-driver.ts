import { prompter } from './prompter';

const driver = async () => {
  // const result = await prompter.confirmContinue('Do you want to push?');
  // console.log(result);
  // const second = await prompter.stringInput('This is a test prompt');
  // console.log(second);
  // const third = await prompter.genericInput<number>('This is a number', { transform: input => Number.parseInt(input, 10) });
  // console.log(third);
  const options = ['first option', 'second option', 'third option'];
  const fourth = await prompter.pickOne('pick an option', options, { initial: 'third option' });
  console.log(fourth);
};

driver();
