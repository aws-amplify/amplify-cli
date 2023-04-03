"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsUpdateSelection = exports.generalQuestionsWalkthrough = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const uuid_1 = require("uuid");
const constants_1 = require("../utils/constants");
async function generalQuestionsWalkthrough(context) {
    return await inquirer_1.default.prompt(generalQuestions(context));
}
exports.generalQuestionsWalkthrough = generalQuestionsWalkthrough;
function generalQuestions(context) {
    return [
        {
            type: 'input',
            name: 'functionName',
            message: 'Provide an AWS Lambda function name:',
            validate: context.amplify.inputValidation({
                operator: 'regex',
                value: '^[a-zA-Z0-9]+$',
                onErrorMsg: 'You can use the following characters: a-z A-Z 0-9',
                required: true,
            }),
            default: () => {
                const appName = context.amplify
                    .getProjectDetails()
                    .projectConfig.projectName.toLowerCase()
                    .replace(/[^0-9a-zA-Z]/gi, '');
                const [shortId] = (0, uuid_1.v4)().split('-');
                return `${appName}${shortId}`;
            },
        },
    ];
}
async function settingsUpdateSelection() {
    const settingsSelectionQuestion = {
        type: 'list',
        name: 'selectedSettings',
        message: 'Which setting do you want to update?',
        choices: constants_1.advancedSettingsList,
    };
    return await inquirer_1.default.prompt([settingsSelectionQuestion]);
}
exports.settingsUpdateSelection = settingsUpdateSelection;
//# sourceMappingURL=generalQuestionsWalkthrough.js.map