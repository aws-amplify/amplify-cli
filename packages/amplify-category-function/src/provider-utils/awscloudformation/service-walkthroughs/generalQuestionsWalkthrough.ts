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
      name: 'resourceName',
      message: 'Provide a friendly name for your resource to be used as a label for this category in the project:',
      validate: context.amplify.inputValidation({
        operator: 'regex',
        value: '^[a-zA-Z0-9]+$',
        onErrorMsg: 'Resource name should be alphanumeric',
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
      default: answers => answers.resourceName,
    },
  ];
}
