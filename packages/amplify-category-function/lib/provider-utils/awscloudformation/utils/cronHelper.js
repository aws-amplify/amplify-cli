"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.yearHelper = exports.monthHelper = exports.weekHelper = exports.timeHelper = exports.hourHelper = exports.minuteHelper = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
inquirer_1.default.registerPrompt('datetime', require('inquirer-datepicker'));
async function minuteHelper(context) {
    const minuteQuestion = {
        type: 'input',
        name: 'minutes',
        message: 'Enter the rate in minutes:',
        validate: context.amplify.inputValidation({
            operator: 'regex',
            value: '^[1-9][0-9]*$',
            onErrorMsg: 'Value needs to be a positive integer',
            required: true,
        }),
    };
    const minuteAnswer = await inquirer_1.default.prompt([minuteQuestion]);
    const plural = minuteAnswer.minutes === '1' ? '' : 's';
    return `rate(${minuteAnswer.minutes} minute${plural})`;
}
exports.minuteHelper = minuteHelper;
async function hourHelper(context) {
    const hourQuestion = {
        type: 'input',
        name: 'hours',
        message: 'Enter the rate in hours:',
        validate: context.amplify.inputValidation({
            validation: {
                operator: 'regex',
                value: '^[1-9][0-9]*$',
                onErrorMsg: 'Value needs to be a positive integer',
            },
            required: true,
        }),
    };
    const hourAnswer = await inquirer_1.default.prompt([hourQuestion]);
    const plural = hourAnswer.hours === '1' ? '' : 's';
    return `rate(${hourAnswer.hours} hour${plural})`;
}
exports.hourHelper = hourHelper;
async function timeHelper(exp) {
    const timeQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'Select the start time in UTC (use arrow keys):',
        format: ['hh', ':', 'mm', ' ', 'A'],
    };
    const timeAnswer = await inquirer_1.default.prompt([timeQuestion]);
    exp.set('minute', timeAnswer.dt.getMinutes().toString().split());
    exp.set('hour', timeAnswer.dt.getHours().toString().split());
    return exp;
}
exports.timeHelper = timeHelper;
async function weekHelper(exp) {
    const WeekQuestion = {
        type: 'list',
        name: 'week',
        message: 'Select the day to invoke the function:',
        choices: [
            { name: 'Sunday', value: '1' },
            { name: 'Monday', value: '2' },
            { name: 'Tuesday', value: '3' },
            { name: 'Wednesday', value: '4' },
            { name: 'Thursday', value: '5' },
            { name: 'Friday', value: '6' },
            { name: 'Saturday', value: '7' },
        ],
    };
    const weekAnswer = await inquirer_1.default.prompt([WeekQuestion]);
    exp.set('dayOfTheWeek', Array(weekAnswer.week));
    exp.set('dayOfTheMonth', Array('?'));
    return exp;
}
exports.weekHelper = weekHelper;
async function monthHelper(exp, context) {
    const dateQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'Select on which day of the month to invoke the function (use arrow keys):',
        format: ['DD'],
    };
    const dateAnswer = await inquirer_1.default.prompt([dateQuestion]);
    if (dateAnswer.dt.getDate() > 28) {
        const suffix = dateAnswer.dt.getDate() === 31 ? 'st' : 'th';
        context.print.warning(`Function won't be invoked on months without the ${dateAnswer.dt.getDate()}${suffix} day`);
    }
    exp.set('dayOfTheMonth', dateAnswer.dt.getDate().toString().split());
    return exp;
}
exports.monthHelper = monthHelper;
async function yearHelper(exp, context) {
    const dateQuestion = {
        type: 'datetime',
        name: 'dt',
        message: 'Select the month and date to invoke the function (mm / dd) (use arrow keys):',
        format: ['MM', '/', 'DD'],
    };
    const dateAnswer = await inquirer_1.default.prompt([dateQuestion]);
    if (dateAnswer.dt.getDate() > 28) {
        const suffix = dateAnswer.dt.getDate() === 31 ? 'st' : 'th';
        context.print.warning(`Function won't be invoked on months without the ${dateAnswer.dt.getDate()}${suffix} day`);
    }
    exp.set('dayOfTheMonth', dateAnswer.dt.getDate().toString().split());
    exp.set('month', dateAnswer.dt.getMonth().toString().split());
    return exp;
}
exports.yearHelper = yearHelper;
//# sourceMappingURL=cronHelper.js.map