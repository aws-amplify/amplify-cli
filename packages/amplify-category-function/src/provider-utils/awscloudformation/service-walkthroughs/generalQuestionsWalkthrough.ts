import inquirer from 'inquirer';
import { v4 as uuid } from 'uuid';
import { FunctionParameters } from '@aws-amplify/amplify-function-plugin-interface';
import { advancedSettingsList } from '../utils/constants';

/**
 * Asks general questions about the function and populates corresponding FunctionParameters
 * @param context The Amplify Context object
 */
export async function generalQuestionsWalkthrough(context: any): Promise<Partial<FunctionParameters>> {
  return await inquirer.prompt(await generalQuestions(context));
}

async function generalQuestions(context: any): Promise<object[]> {
  const existingLambdaFunctions = await context.amplify.getResourceStatus('function');
  return [
    {
      type: 'input',
      name: 'functionName',
      message: 'Provide an AWS Lambda function name:',
      validate: (input: string) => {
        const functionExists = existingLambdaFunctions.allResources.some((resource) => resource.resourceName === input);
        if (functionExists) {
          return 'A function with this name already exists.';
        }
        return context.amplify.inputValidation({
          operator: 'regex',
          value: '^[a-zA-Z0-9]+$',
          onErrorMsg: 'You can use the following characters: a-z A-Z 0-9',
          required: true,
        })(input);
      },
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

export async function settingsUpdateSelection() {
  const settingsSelectionQuestion = {
    type: 'list',
    name: 'selectedSettings',
    message: 'Which setting do you want to update?',
    choices: advancedSettingsList,
  };
  return await inquirer.prompt([settingsSelectionQuestion]);
}
