import { and, integer, matchRegex, printer, prompter, greaterThan, lessThan } from 'amplify-prompts';
import { CronBuilder } from '../utils/cronBuilder';

export type dtType = any;
export async function minuteHelper(context: any) {
  const minuteAnswer = await prompter.input('Enter the rate in minutes:', {
    validate: matchRegex(/^[1-9][0-9]*$/, 'Value needs to be a positive integer'),
  });
  const plural = minuteAnswer === '1' ? '' : 's';
  return `rate(${minuteAnswer} minute${plural})`;
}

export async function hourHelper(context: any) {
  const hourAnswer = await prompter.input('Enter the rate in hours:', {
    validate: matchRegex(/^[1-9][0-9]*$/, 'Value needs to be a positive integer'),
  });
  const plural = hourAnswer === '1' ? '' : 's';
  return `rate(${hourAnswer} hour${plural})`;
}

export async function timeHelper(exp: CronBuilder) {
  const timeAnswer = await prompter.input('Enter the start time in UTC (hh:mm AM/PM):', {
    validate: matchRegex(/^([0-1][0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/, 'Value needs to be in the format hh:mm AM/PM'),
    transform: (input: string) => {
      const [time, am] = input.split(' ');
      const [hour, minute] = time.split(':');
      const hourInt = am === 'AM' ? parseInt(hour, 10) : parseInt(hour, 10) + 12;
      const minuteInt = parseInt(minute, 10);
      return { hour: hourInt, minute: minuteInt };
    },
  });

  exp.set('minute', timeAnswer.minute);
  exp.set('hour', timeAnswer.hour);

  return exp;
}

export async function weekHelper(exp: CronBuilder) {
  const choices = [
    { name: 'Sunday', value: '1' },
    { name: 'Monday', value: '2' },
    { name: 'Tuesday', value: '3' },
    { name: 'Wednesday', value: '4' },
    { name: 'Thursday', value: '5' },
    { name: 'Friday', value: '6' },
    { name: 'Saturday', value: '7' },
  ];
  const weekAnswer = await prompter.pick('Select the day to invoke the function:', choices);
  exp.set('dayOfTheWeek', Array(weekAnswer));
  exp.set('dayOfTheMonth', Array('?'));
  return exp;
}

export async function monthHelper(exp, context) {
  const dateAnswer = await prompter.input('Enter the day of the month to invoke the function:', {
    validate: and([greaterThan(0), lessThan(32)]),
    transform: (input: string) => parseInt(input, 10),
  });

  if (dateAnswer > 28) {
    const suffix = dateAnswer === 31 ? 'st' : 'th';
    printer.warn(`Function won't be invoked on months without the ${dateAnswer}${suffix} day`);
  }
  exp.set('dayOfTheMonth', dateAnswer);
  return exp;
}

export async function yearHelper(exp, context) {
  const monthAnswer = prompter.pick('Select the month to invoke the function:', [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]);
  exp.set('month', monthAnswer);
  exp = await monthHelper(exp, context);
  return exp;
}
