import inquirer from 'inquirer';
inquirer.registerPrompt('datetime', require('inquirer-datepicker'));
import { CronBuilder } from '../utils/cronBuilder';

var Days = {
    MON: '1',
    TUE: '2',
    WED: '3',
    THU: '4',
    FRI: '5',
    SAT: '6',
    SUN: '7',
  };

export async function minuteHelper(context : any){
    const minuteQuestion = {
        type: 'input',
        name: 'minutes',
        message: 'Enter the rate in mintues:',
        validate: context.amplify.inputValidation({
            operator: 'regex',
            value: '^[1-9][0-9]*$', // change to /d after checking
            onErrorMsg: 'Resouce should be numeric',
            required: true,
        }),
      };
    const minuteAnswer = await inquirer.prompt([minuteQuestion]);
    const plural = minuteAnswer.minutes === 1 ? '' : 's';
    let cloudwatchRule = `rate(${minuteAnswer.minutes} minute${plural})`
    return cloudwatchRule;
}

export async function hourHelper(context : any){
    const hourQuestion = {
        type: 'input',
        name: 'hours',
        message: 'Enter the rate in hours:',
        validate: context.amplify.inputValidation({
          validation: {
            operator: 'regex',
            value: '^[1-9][0-9]*$',
            onErrorMsg: 'Resouce should be numeric',
          },
          required: true,
        }),
      };
    const hourAnswer = await inquirer.prompt([hourQuestion]);
    const plural = hourAnswer.hours === 1 ? '' : 's';
    let cloudwatchRule = `rate(${hourAnswer.hours} hour${plural})`
    return cloudwatchRule
}

export async function timeHelper( exp : CronBuilder){
    const timeQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'Select the start time (use arrow keys):',
        format: ['HH', ':', 'mm', ' ', 'A'],
      };
    const timeAnswer = await inquirer.prompt([timeQuestion]);
    exp.set(
    'minute',
    (timeAnswer.dt as any)
        .getMinutes()
        .toString()
        .split(),
    );
    exp.set(
    'hour',
    (timeAnswer.dt as any)
        .getHours()
        .toString()
        .split(),
    );
    return exp;
}

export async function weekHelper( exp : CronBuilder){
    const WeekQuestion = {
        type: 'list',
        name: 'week',
        message: 'Select the day to invoke the function:',
        choices: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    };
    const weekAnswer = await inquirer.prompt([WeekQuestion]);
    exp.set('dayOfTheWeek', Days[(weekAnswer as any).week].split());
    return exp;
}

export async function monthHelper(exp){
    const dateQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'Select on which day of the month to invoke the function (dd)(use arrow keys):',
        format: ['DD'],
      };
    const dateAnswer = await inquirer.prompt([dateQuestion]);
    exp.set(
        'dayOfTheMonth',
        (dateAnswer.dt as any)
          .getDate()
          .toString()
          .split(),
      );
    return exp;
}

export async function yearHelper(exp){
    const dateQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'Select the month and date to invoke the function (mm / dd) (use arrow keys):',
        format: ['MM', '/', 'DD'],
      };
      const dateAnswer = await inquirer.prompt([dateQuestion]);
      exp.set(
        'dayOfTheMonth',
        (dateAnswer.dt as any)
          .getDate()
          .toString()
          .split(),
      );
      exp.set(
        'month',
        (dateAnswer.dt as any)
          .getMonth()
          .toString()
          .split(),
      );
    return exp;
}