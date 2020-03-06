const path = require('path');
const inquirer = require('inquirer');
const fs = require('fs-extra');
inquirer.registerPrompt('datetime', require('inquirer-datepicker-prompt'));
const cb = require('cron-builder');
const cronstrue = require('cronstrue');
const categoryName = 'function';

var Days = {
  MON: '1',
  TUE: '2',
  WED: '3',
  THURS: '4',
  FRI: '5',
  SAT: '6',
  SUN: '7',
};

async function askScheduleRuleQuestions(context, resourceName, parameters) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, categoryName, resourceName);
  const cfnFileName = `${resourceName}-cloudformation-template.json`;
  const cfnFilePath = path.join(resourceDirPath, cfnFileName);

  if (!parameters || !parameters.cloudwatchEvent || parameters.cloudwatchEvent === 'NONE') {
    if (await context.amplify.confirmPrompt.run('Do you want to schedule this lambda function?', false)) {
      parameters.cloudwatchEvent = 'true';
      try {
        cloudWatchRule = await cronServiceWalkthrough(context, parameters);
        parameters.cloudwatchRule = cloudWatchRule;
        if (context.input.command === 'update') {
          //append cloudwatch events to CFN File
          const cfnContent = context.amplify.readJsonFile(cfnFilePath);
          cfnContent.Resources.CloudWatchEvent = {
            Type: 'AWS::Events::Rule',
            Properties: {
              Description: 'Schedule rule for Lambda',
              ScheduleExpression: cloudWatchRule,
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
              SourceArn: { 'Fn::GetAtt': ['CloudwatchEvent', 'Arn'] },
            },
          };
          fs.writeFileSync(cfnFilePath, JSON.stringify(cfnContent, null, 4));
        }
      } catch (e) {
        context.print.error(e.message);
      }
    }
  } else {
    if (await context.amplify.confirmPrompt.run('Do you want to Update/Remove the ScheduleEvent Rule?', false)) {
      const cfnContent = context.amplify.readJsonFile(cfnFilePath);
      const scheduleEventOperationQuestion = {
        type: 'list',
        name: 'ScheduleEventOperation',
        message: 'Select from the following options',
        choices: ['Update the CronJob', 'Remove the CronJob'],
      };

      const scheduleEventOperationAnswer = await inquirer.prompt([scheduleEventOperationQuestion]);

      switch (scheduleEventOperationAnswer.ScheduleEventOperation) {
        case 'Update the CronJob': {
          // add service walkthrough to get the cron expression
          cloudWatchRule = await cronServiceWalkthrough(context, parameters);
          parameters.cloudwatchEvent = 'true';
          parameters.cloudwatchRule = cloudWatchRule;
          cfnContent.Resources.CloudWatchEvent.Properties.ScheduleExpression = parameters.cloudwatchRule;
          fs.writeFileSync(cfnFilePath, JSON.stringify(cfnContent, null, 4));
          break;
        }
        case 'Remove the CronJob': {
          parameters.cloudwatchEvent = 'NONE';
          parameters.cloudwatchRule = 'NONE';
          delete cfnContent.Resources.CloudWatchEvent;
          delete cfnContent.Resources.PermissionForEventsToInvokeLambda;
          fs.writeFileSync(cfnFilePath, JSON.stringify(cfnContent, null, 4));
          break;
        }
        default:
          console.log(`${scheduleEventOperationAnswer.scheduleEventOperation} not supported`);
      }
    }
  }
}

async function cronServiceWalkthrough(context, parameters) {
  let cloudwatchRule;
  // resource questions for setting cron
  const timeQuestion = {
    type: 'datetime',
    name: 'dt',
    message: 'When would you like to start cron?',
    format: ['h', ':', 'MM', ' ', 'TT'],
  };
  const timeAnswer = await inquirer.prompt([timeQuestion]);

  const intervalQuestion = {
    type: 'list',
    name: 'interval',
    message: 'Please select interval or select custom rule exp?',
    choices: ['daily', 'weekly', 'monthly', 'yearly', 'customRule'],
  };
  const intervalAnswer = await inquirer.prompt([intervalQuestion]);
  switch (intervalAnswer.interval) {
    case 'daily': {
      var exp = new cb();
      exp.set(
        'minute',
        timeAnswer.dt
          .getMinutes()
          .toString()
          .split(),
      );
      exp.set(
        'hour',
        timeAnswer.dt
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
        message: 'Please select the  day to start Job?',
        choices: ['MON', 'TUE', 'WED', 'THURS', 'FRI', 'SAT', 'SUN'],
      };
      var exp1 = new cb();
      const weekAnswer = await inquirer.prompt([WeekQuestion]);
      exp1.set(
        'minute',
        timeAnswer.dt
          .getMinutes()
          .toString()
          .split(),
      );
      exp1.set(
        'hour',
        timeAnswer.dt
          .getHours()
          .toString()
          .split(),
      );
      exp1.set('dayOfTheWeek', Days[weekAnswer.week].split());
      cloudwatchRule = exp1.build();
      cloudwatchRule = 'cron(' + cloudwatchRule + ' ' + '*' + ')';
      break;
    }
    case 'monthly': {
      const dateQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'Select date to start cron?',
        format: ['d'],
      };
      const dateAnswer = await inquirer.prompt([dateQuestion]);
      cloudwatchRule = makeCron(intervalAnswer.interval, dateAnswer, timeAnswer);
      cloudwatchRule = 'cron(' + replaceAt(cloudwatchRule, cloudwatchRule.lastIndexOf('*'), '?') + ' ' + '*' + ')';
      break;
    }
    case 'yearly': {
      const dateQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'select month and date to start cron?',
        format: ['m', '/', 'd'],
      };
      const dateAnswer = await inquirer.prompt([dateQuestion]);
      cloudwatchRule = makeCron(intervalAnswer.interval, dateAnswer, timeAnswer);
      cloudwatchRule = 'cron(' + replaceAt(cloudwatchRule, cloudwatchRule.lastIndexOf('*'), '?') + ' ' + '*' + ')';

      break;
    }
  }
  // check if the given cron is valid
  return cloudwatchRule;
}

function makeCron(interval, dateAnswer, timeAnswer) {
  var cronExp = new cb();
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
  askScheduleRuleQuestions,
  cronServiceWalkthrough,
};
