import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import { FunctionParameters } from 'amplify-function-plugin-interface';
inquirer.registerPrompt('datetime', require('inquirer-datepicker'));
import { CronBuilder } from '../utils/cronBuilder';
import { constructCloudWatchEventComponent } from '../utils/cloudformationHelpers';
import { minuteHelper, hourHelper, timeHelper, weekHelper, monthHelper, yearHelper } from '../utils/cronHelper';
import { CronExpressionsMode } from '../utils/constants';
import { CronExpression } from '../utils/cronExpression';
const categoryName = 'function';

export async function scheduleWalkthrough(
  context: any,
  params: Partial<FunctionParameters>,
): Promise<Pick<FunctionParameters, 'cloudwatchRule'>> {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, categoryName, params.resourceName);
  const cfnFileName = `${params.resourceName}-cloudformation-template.json`;
  const cfnFilePath = path.join(resourceDirPath, cfnFileName);
  let scheduleParams = params;
  if (params.cloudwatchRule === undefined || params.cloudwatchRule === 'NONE') {
    if (await context.amplify.confirmPrompt.run('Do you want to invoke this function on a recurring schedule?', false)) {
      try {
        let cloudWatchRule = await cronServiceWalkthrough(context);
        scheduleParams.cloudwatchRule = cloudWatchRule;
        if (context.input.command === 'update') {
          //append cloudwatch events to CFN File
          const cfnContent = context.amplify.readJsonFile(cfnFilePath);
          constructCloudWatchEventComponent(cfnFilePath, cfnContent);
          context.amplify.writeObjectAsJson(cfnFilePath, cfnContent);
        }
      } catch (e) {
        context.print.error(e.message);
      }
    }
  } else {
    if (await context.amplify.confirmPrompt.run(`Do you want to update or remove the function's schedule?`, false)) {
      const cfnContent = context.amplify.readJsonFile(cfnFilePath);
      const scheduleEventOperationQuestion = {
        type: 'list',
        name: 'ScheduleEventOperation',
        message: 'Select from the following options:',
        choices: [
          {
            name: 'Update the schedule',
            value: 'update',
          },
          {
            name: 'Remove the schedule',
            value: 'remove',
          },
        ],
      };

      const scheduleEventOperationAnswer = await inquirer.prompt([scheduleEventOperationQuestion]);
      switch (scheduleEventOperationAnswer.ScheduleEventOperation) {
        case 'update': {
          // add service walkthrough to get the cron expression
          let cloudWatchRule = await cronServiceWalkthrough(context);
          scheduleParams.cloudwatchRule = cloudWatchRule;
          break;
        }
        case 'remove': {
          scheduleParams.cloudwatchRule = 'NONE';
          delete cfnContent.Resources.CloudWatchEvent;
          delete cfnContent.Resources.PermissionForEventsToInvokeLambda;
          delete cfnContent.Outputs.CloudWatchEventRule;
          break;
        }
      }
      fs.writeFileSync(cfnFilePath, JSON.stringify(cfnContent, null, 4));
    }
  }
  return {
    cloudwatchRule: scheduleParams.cloudwatchRule,
  };
}

export async function cronServiceWalkthrough(context: any) {
  let cloudwatchRule;
  // resource questions for setting cron
  const intervalQuestion = {
    type: 'list',
    name: 'interval',
    message: 'At which interval should the function be invoked:',
    choices: ['Minutes', 'Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom AWS cron expression'],
  };
  const intervalAnswer = await inquirer.prompt([intervalQuestion]);
  switch (intervalAnswer.interval) {
    case CronExpressionsMode.Minutes: {
      cloudwatchRule = minuteHelper(context);
      break;
    }
    case CronExpressionsMode.Hourly: {
      cloudwatchRule = hourHelper(context);
      break;
    }
    case CronExpressionsMode.Daily: {
      var exp = new CronBuilder();
      exp = await timeHelper(exp);
      cloudwatchRule = exp.build();
      cloudwatchRule = 'cron(' + replaceAt(cloudwatchRule, cloudwatchRule.lastIndexOf('*'), '?') + ' ' + '*' + ')';
      break;
    }
    case CronExpressionsMode.Weekly: {
      var exp1 = new CronBuilder();
      exp1 = await weekHelper(exp1);
      exp1 = await timeHelper(exp1);
      cloudwatchRule = exp1.build();
      cloudwatchRule = 'cron(' + cloudwatchRule + ' ' + '*' + ')';
      break;
    }
    case CronExpressionsMode.Monthly: {
      var exp2 = new CronBuilder();
      exp2 = await monthHelper(exp2, context);
      exp2 = await timeHelper(exp2);
      cloudwatchRule = exp2.build();
      cloudwatchRule = 'cron(' + replaceAt(cloudwatchRule, cloudwatchRule.lastIndexOf('*'), '?') + ' ' + '*' + ')';
      break;
    }
    case CronExpressionsMode.Yearly: {
      var exp3 = new CronBuilder();
      exp3 = await yearHelper(exp3, context);
      exp3 = await timeHelper(exp3);
      cloudwatchRule = exp3.build();
      cloudwatchRule = 'cron(' + replaceAt(cloudwatchRule, cloudwatchRule.lastIndexOf('*'), '?') + ' ' + '*' + ')';

      break;
    }
    case CronExpressionsMode.Custom: {
      const customRuleQuestion = {
        type: 'input',
        name: 'customRule',
        message: 'Custom Schedule expression(Learn more: https://amzn.to/3akXtJF)',
        validate: ValidCronExpression({
          onErrorMsg: 'Enter a valid Schedule Expression (Learn more: https://amzn.to/3akXtJF)',
        }),
      };
      const customRuleAnswer = await inquirer.prompt([customRuleQuestion]);
      cloudwatchRule = 'cron(' + customRuleAnswer.customRule + ')';

      break;
    }
  }
  return cloudwatchRule;
}

function replaceAt(string, index, replace) {
  return string.substring(0, index) + replace + string.substring(index + 1);
}

function ValidCronExpression(validation) {
  return input => {
    return isValidCronExpression(input) ? true : validation.onErrorMsg;
  };
}

export function isValidCronExpression(cronExpression: string): boolean {
  try {
    new CronExpression(cronExpression);
    return true;
  } catch (e) {
    return false;
  }
}
