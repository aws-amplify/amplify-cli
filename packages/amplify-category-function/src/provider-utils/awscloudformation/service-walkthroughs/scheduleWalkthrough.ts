import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import { FunctionParameters } from 'amplify-function-plugin-interface';
inquirer.registerPrompt('datetime', require('inquirer-datepicker'));
import {CronBuilder}  from '../utils/cronBuilder';
const categoryName = 'function';

var Days = {
  MON: '1',
  TUE: '2',
  WED: '3',
  THU: '4',
  FRI: '5',
  SAT: '6',
  SUN: '7',
};

export async function scheduleWalkthrough(context: any, params: Partial<FunctionParameters>): Promise<Partial<FunctionParameters>> {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, categoryName, params.resourceName);
  const cfnFileName = `${params.resourceName}-cloudformation-template.json`;
  const cfnFilePath = path.join(resourceDirPath, cfnFileName);
  let scheduleParams: Partial<FunctionParameters> = params;
  if (params.cloudwatchEnabled === undefined || params.cloudwatchEnabled === 'false') {
    if (await context.amplify.confirmPrompt.run('Do you want this function to be invoked on a schedule?', false)) {
      scheduleParams.cloudwatchEnabled = 'true';
      try {
        let cloudWatchRule = await cronServiceWalkthrough(context);
        scheduleParams.cloudwatchRule = cloudWatchRule;
        if (context.input.command === 'update') {
          //append cloudwatch events to CFN File
          const cfnContent = context.amplify.readJsonFile(cfnFilePath);
          cfnContent.Resources.CloudWatchEvent = {
            Type: 'AWS::Events::Rule',
            Properties: {
              Description: 'Schedule rule for Lambda',
              ScheduleExpression: {
                Ref: 'CloudWatchRule',
              },
              State: 'ENABLED',
              Targets: [
                {
                  Arn: { 'Fn::GetAtt': ['LambdaFunction', 'Arn'] },
                  Id: {
                    Ref: 'LambdaFunction',
                  },
                },
              ],
            },
          };
          // append permissions to invoke lambda via cloiudwatch to CFN file
          cfnContent.Resources.PermissionForEventsToInvokeLambda = {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              FunctionName: {
                Ref: 'LambdaFunction',
              },
              Action: 'lambda:InvokeFunction',
              Principal: 'events.amazonaws.com',
              SourceArn: { 'Fn::GetAtt': ['CloudWatchEvent', 'Arn'] },
            },
          };
          // append the outputs section of cloudwatchRULE
          cfnContent.Outputs.CloudWatchEventRule = {
            Value: {
              Ref: 'CloudWatchEvent',
            },
          };
          fs.writeFileSync(cfnFilePath, JSON.stringify(cfnContent, null, 4));
        }
      } catch (e) {
        context.print.error(e.message);
      }
    }
  } else {
    if (await context.amplify.confirmPrompt.run('Do you want to update or remove the function schedule?', false)) {
      const cfnContent = context.amplify.readJsonFile(cfnFilePath);
      const scheduleEventOperationQuestion = {
        type: 'list',
        name: 'ScheduleEventOperation',
        message: 'Select from the following options (Use arrow keys)',
        choices: ['Update the schedule', 'Remove the schedule'],
      };

      const scheduleEventOperationAnswer = await inquirer.prompt([scheduleEventOperationQuestion]);

      switch (scheduleEventOperationAnswer.ScheduleEventOperation) {
        case 'Update the schedule': {
          // add service walkthrough to get the cron expression
          let cloudWatchRule = await cronServiceWalkthrough(context);
          scheduleParams.cloudwatchEnabled = 'true';
          scheduleParams.cloudwatchRule = cloudWatchRule;
          fs.writeFileSync(cfnFilePath, JSON.stringify(cfnContent, null, 4));
          break;
        }
        case 'Remove the schedule': {
          scheduleParams.cloudwatchEnabled = 'false';
          scheduleParams.cloudwatchRule = 'NONE';
          delete cfnContent.Resources.CloudWatchEvent;
          delete cfnContent.Resources.PermissionForEventsToInvokeLambda;
          delete cfnContent.Outputs.CloudWatchEventRule;

          fs.writeFileSync(cfnFilePath, JSON.stringify(cfnContent, null, 4));
          break;
        }
        default:
          console.log(`${scheduleEventOperationAnswer.scheduleEventOperation} not supported`);
      }
    }
  }
  return scheduleParams;
}

async function cronServiceWalkthrough(context : any) {
  let cloudwatchRule;
  // resource questions for setting cron
  const intervalQuestion = {
    type: 'list',
    name: 'interval',
    message: 'At which interval should the function be invoked?',
    choices: ['minutes', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'customRule'],
  };
  const intervalAnswer = await inquirer.prompt([intervalQuestion]);
  switch (intervalAnswer.interval) {
    case 'minutes': {
      const minuteQuestion = {
        type: 'input',
        name: 'minutes',
        message: 'Enter the rate in mintues?',
        validate: context.amplify.inputValidation({
          validation:{
            operator: "regex",
            value: "^[1-9][0-9]*$",
            onErrorMsg: "Resouce should be numeric"
          },
        required: true
        })
      };
      const minuteAnswer = await inquirer.prompt([minuteQuestion]);
      if (minuteAnswer.minutes === '1') {
        cloudwatchRule = 'rate(' + minuteAnswer.minutes + ' minute)';
      } else {
        cloudwatchRule = 'rate(' + minuteAnswer.minutes + ' minutes)';
      }
      break;
    }
    case 'hourly': {
      const hourQuestion = {
        type: 'input',
        name: 'hours',
        message: 'Enter the rate in hours?',
        validate: context.amplify.inputValidation({
          validation:{
            operator: "regex",
            value: "^[1-9][0-9]*$",
            onErrorMsg: "Resouce should be numeric"
          },
        required: true
        })
      };
      const hourAnswer = await inquirer.prompt([hourQuestion]);
      if (hourAnswer.hours === '1') {
        cloudwatchRule = 'rate(' + hourAnswer.hours + ' hour)';
      } else {
        cloudwatchRule = 'rate(' + hourAnswer.hours + ' hours)';
      }
      break;
    }
    case 'daily': {
      const timeQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'Select the start time (use arrow keys)?',
        format: ['HH', ':', 'mm', ' ', 'A'],
      };
      const timeAnswer = await inquirer.prompt([timeQuestion]);
      var exp = new CronBuilder();
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
      cloudwatchRule = exp.build();
      cloudwatchRule = 'cron(' + replaceAt(cloudwatchRule, cloudwatchRule.lastIndexOf('*'), '?') + ' ' + '*' + ')';
      break;
    }
    case 'weekly': {
      const WeekQuestion = {
        type: 'list',
        name: 'week',
        message: 'Select the day to invoke the function?',
        choices: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      };
      var exp1 = new CronBuilder();
      const weekAnswer = await inquirer.prompt([WeekQuestion]);
      const timeQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'Select the start time (use arrow keys)?',
        format: ['HH', ':', 'mm', ' ', 'A'],
      };
      const timeAnswer = await inquirer.prompt([timeQuestion]);
      exp1.set(
        'minute',
        (timeAnswer.dt as any)
          .getMinutes()
          .toString()
          .split(),
      );
      exp1.set(
        'hour',
        (timeAnswer.dt as any)
          .getHours()
          .toString()
          .split(),
      );
      exp1.set('dayOfTheWeek', Days[(weekAnswer as any).week].split());
      cloudwatchRule = exp1.build();
      cloudwatchRule = 'cron(' + cloudwatchRule + ' ' + '*' + ')';
      break;
    }
    case 'monthly': {
      const dateQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'Select on which day of the month to invoke the function (dd)(use arrow keys):',
        format: ['DD'],
      };
      const timeQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'Select the start time (use arrow keys)?',
        format: ['HH', ':', 'mm', ' ', 'A'],
      };
      const timeAnswer = await inquirer.prompt([timeQuestion]);
      const dateAnswer = await inquirer.prompt([dateQuestion]);
      cloudwatchRule = makeCron(intervalAnswer.interval, dateAnswer, timeAnswer);
      cloudwatchRule = 'cron(' + replaceAt(cloudwatchRule, cloudwatchRule.lastIndexOf('*'), '?') + ' ' + '*' + ')';
      break;
    }
    case 'yearly': {
      const dateQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'Select the month and date to invoke the function (mm / dd) (use arrow keys):',
        format: ['MM', '/', 'DD'],
      };
      const timeQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'Select the start time (use arrow keys)?',
        format: ['HH', ':', 'mm', ' ', 'A'],
      };
      const timeAnswer = await inquirer.prompt([timeQuestion]);
      const dateAnswer = await inquirer.prompt([dateQuestion]);
      cloudwatchRule = makeCron(intervalAnswer.interval, dateAnswer, timeAnswer);
      cloudwatchRule = 'cron(' + replaceAt(cloudwatchRule, cloudwatchRule.lastIndexOf('*'), '?') + ' ' + '*' + ')';

      break;
    }
    case 'customRule': {
      const customRuleQuestion = {
        type: 'input',
        name: 'customRule',
        message: 'Custom Schedule expression(Learn more : https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html)',
      };
      const customRuleAnswer = await inquirer.prompt([customRuleQuestion]);
      cloudwatchRule = 'cron(' + customRuleAnswer.customRule + ')';

      break;
    }
  }
  // check if the given cron is valid
  return cloudwatchRule;
}

function makeCron(interval, dateAnswer, timeAnswer) {
  var cronExp = new CronBuilder();
  if (interval === 'monthly') {
    cronExp.set(
      'minute',
      timeAnswer.dt
        .getMinutes()
        .toString()
        .split(),
    );
    cronExp.set(
      'hour',
      timeAnswer.dt
        .getHours()
        .toString()
        .split(),
    );
    cronExp.set(
      'dayOfTheMonth',
      dateAnswer.dt
        .getDate()
        .toString()
        .split(),
    );
  } else if (interval === 'yearly') {
    cronExp.set(
      'minute',
      timeAnswer.dt
        .getMinutes()
        .toString()
        .split(),
    );
    cronExp.set(
      'hour',
      timeAnswer.dt
        .getHours()
        .toString()
        .split(),
    );
    cronExp.set(
      'dayOfTheMonth',
      dateAnswer.dt
        .getDate()
        .toString()
        .split(),
    );
    cronExp.set(
      'month',
      dateAnswer.dt
        .getMonth()
        .toString()
        .split(),
    );
  }
  let str = cronExp.build();
  return str;
}

function replaceAt(string, index, replace) {
  return string.substring(0, index) + replace + string.substring(index + 1);
}

module.exports = {
  scheduleWalkthrough,
  cronServiceWalkthrough,
};
