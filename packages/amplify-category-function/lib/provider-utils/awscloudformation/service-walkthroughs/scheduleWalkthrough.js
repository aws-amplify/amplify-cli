"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidCronExpression = exports.cronServiceWalkthrough = exports.scheduleWalkthrough = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
inquirer_1.default.registerPrompt('datetime', require('inquirer-datepicker'));
const cronBuilder_1 = require("../utils/cronBuilder");
const cloudformationHelpers_1 = require("../utils/cloudformationHelpers");
const cronHelper_1 = require("../utils/cronHelper");
const cronExpression_1 = require("../utils/cronExpression");
const constants_1 = require("../../../constants");
async function scheduleWalkthrough(context, params, defaultConfirm = false) {
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const resourceDirPath = path_1.default.join(projectBackendDirPath, constants_1.categoryName, params.resourceName);
    const cfnFileName = `${params.resourceName}-cloudformation-template.json`;
    const cfnFilePath = path_1.default.join(resourceDirPath, cfnFileName);
    const scheduleParams = params;
    if (params.cloudwatchRule === undefined || params.cloudwatchRule === 'NONE') {
        if (await context.amplify.confirmPrompt('Do you want to invoke this function on a recurring schedule?', defaultConfirm)) {
            try {
                const cloudWatchRule = await cronServiceWalkthrough(context);
                scheduleParams.cloudwatchRule = cloudWatchRule;
                if (context.input.command === 'update') {
                    const cfnContent = context.amplify.readJsonFile(cfnFilePath);
                    (0, cloudformationHelpers_1.constructCloudWatchEventComponent)(cfnFilePath, cfnContent);
                    context.amplify.writeObjectAsJson(cfnFilePath, cfnContent);
                }
            }
            catch (e) {
                context.print.error(e.message);
            }
        }
    }
    else {
        if (await context.amplify.confirmPrompt(`Do you want to update or remove the function's schedule?`, defaultConfirm)) {
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
            const scheduleEventOperationAnswer = await inquirer_1.default.prompt([scheduleEventOperationQuestion]);
            switch (scheduleEventOperationAnswer.ScheduleEventOperation) {
                case 'update': {
                    const cloudWatchRule = await cronServiceWalkthrough(context);
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
            fs_extra_1.default.writeFileSync(cfnFilePath, JSON.stringify(cfnContent, null, 4));
        }
    }
    return {
        cloudwatchRule: scheduleParams.cloudwatchRule,
    };
}
exports.scheduleWalkthrough = scheduleWalkthrough;
async function cronServiceWalkthrough(context) {
    let cloudwatchRule;
    const intervalQuestion = {
        type: 'list',
        name: 'interval',
        message: 'At which interval should the function be invoked:',
        choices: ['Minutes', 'Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom AWS cron expression'],
    };
    const intervalAnswer = await inquirer_1.default.prompt([intervalQuestion]);
    switch (intervalAnswer.interval) {
        case "Minutes": {
            cloudwatchRule = (0, cronHelper_1.minuteHelper)(context);
            break;
        }
        case "Hourly": {
            cloudwatchRule = (0, cronHelper_1.hourHelper)(context);
            break;
        }
        case "Daily": {
            let exp = new cronBuilder_1.CronBuilder();
            exp = await (0, cronHelper_1.timeHelper)(exp);
            cloudwatchRule = exp.build();
            cloudwatchRule = 'cron(' + replaceAt(cloudwatchRule, cloudwatchRule.lastIndexOf('*'), '?') + ' ' + '*' + ')';
            break;
        }
        case "Weekly": {
            let exp1 = new cronBuilder_1.CronBuilder();
            exp1 = await (0, cronHelper_1.weekHelper)(exp1);
            exp1 = await (0, cronHelper_1.timeHelper)(exp1);
            cloudwatchRule = exp1.build();
            cloudwatchRule = 'cron(' + cloudwatchRule + ' ' + '*' + ')';
            break;
        }
        case "Monthly": {
            let exp2 = new cronBuilder_1.CronBuilder();
            exp2 = await (0, cronHelper_1.monthHelper)(exp2, context);
            exp2 = await (0, cronHelper_1.timeHelper)(exp2);
            cloudwatchRule = exp2.build();
            cloudwatchRule = 'cron(' + replaceAt(cloudwatchRule, cloudwatchRule.lastIndexOf('*'), '?') + ' ' + '*' + ')';
            break;
        }
        case "Yearly": {
            let exp3 = new cronBuilder_1.CronBuilder();
            exp3 = await (0, cronHelper_1.yearHelper)(exp3, context);
            exp3 = await (0, cronHelper_1.timeHelper)(exp3);
            cloudwatchRule = exp3.build();
            cloudwatchRule = 'cron(' + replaceAt(cloudwatchRule, cloudwatchRule.lastIndexOf('*'), '?') + ' ' + '*' + ')';
            break;
        }
        case "Custom AWS cron expression": {
            const customRuleQuestion = {
                type: 'input',
                name: 'customRule',
                message: 'Custom Schedule expression(Learn more: https://amzn.to/3akXtJF)',
                validate: ValidCronExpression({
                    onErrorMsg: 'Enter a valid Schedule Expression (Learn more: https://amzn.to/3akXtJF)',
                }),
            };
            const customRuleAnswer = await inquirer_1.default.prompt([customRuleQuestion]);
            cloudwatchRule = 'cron(' + customRuleAnswer.customRule + ')';
            break;
        }
    }
    return cloudwatchRule;
}
exports.cronServiceWalkthrough = cronServiceWalkthrough;
function replaceAt(string, index, replace) {
    return string.substring(0, index) + replace + string.substring(index + 1);
}
function ValidCronExpression(validation) {
    return (input) => {
        return isValidCronExpression(input) ? true : validation.onErrorMsg;
    };
}
function isValidCronExpression(cronExpression) {
    try {
        new cronExpression_1.CronExpression(cronExpression);
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.isValidCronExpression = isValidCronExpression;
//# sourceMappingURL=scheduleWalkthrough.js.map