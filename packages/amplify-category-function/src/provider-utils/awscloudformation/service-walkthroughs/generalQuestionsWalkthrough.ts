import inquirer from 'inquirer';
import uuid from 'uuid';
import { FunctionParameters } from 'amplify-function-plugin-interface';

/**
 * Asks general questions about the function and populates corresponding FunctionParameters
 * @param context The Amplify Context object
 */
export default async function generalQuestionsWalkthrough(context: any): Promise<Partial<FunctionParameters>> {
  return await inquirer.prompt(generalQuestions(context));
}

function generalQuestions(context: any): object[] {
  return [
    {
      type: 'input',
      name: 'functionName',
      message: 'Provide the AWS Lambda function name:',
      validate: context.amplify.inputValidation({
        operator: 'regex',
        value: '^[a-zA-Z0-9._-]+$',
        onErrorMsg: 'You can use the following characters: a-z A-Z 0-9 . - _',
        required: true,
      }),
      default: () => {
        const appName = context.amplify
          .getProjectDetails()
          .projectConfig.projectName.toLowerCase()
          .replace(/[^0-9a-zA-Z]/gi, '');
        const [shortId] = uuid().split('-');
        return `${appName}${shortId}`;
      },
    },
  ];
}
