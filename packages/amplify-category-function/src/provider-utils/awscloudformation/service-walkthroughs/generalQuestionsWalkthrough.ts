import inquirer from 'inquirer';
import { v4 as uuid } from 'uuid';
import { FunctionParameters } from '@aws-amplify/amplify-function-plugin-interface';
import { advancedSettingsList } from '../utils/constants';
import { prompter } from '@aws-amplify/amplify-prompts';
import { $TSContext } from '@aws-amplify/amplify-cli-core';

/**
 * Asks general questions about the function and populates corresponding FunctionParameters
 * @param context The Amplify Context object
 */
export async function generalQuestionsWalkthrough(context: $TSContext): Promise<Partial<FunctionParameters>> {
  const appName = context.amplify
    .getProjectDetails()
    .projectConfig.projectName.toLowerCase()
    .replace(/[^0-9a-zA-Z]/gi, '');
  const [shortId] = uuid().split('-');
  const functionName = `${appName}${shortId}`;

  return {
    functionName: await prompter.input('Provide an AWS Lambda function name:', {
      validate: async (input: string) => {
        const lambdaFunctions = await context.amplify.getResourceStatus('function');
        const functionExists = lambdaFunctions.allResources.some((resource) => resource.resourceName === input);
        if (functionExists) {
          return 'A function with this name already exists.';
        }

        const validationResult = context.amplify.inputValidation({
          operator: 'regex',
          value: '^[a-zA-Z0-9]+$',
          onErrorMsg: 'You can use the following characters: a-z A-Z 0-9',
          required: true,
        })(input);

        return validationResult === false ? 'You can use the following characters: a-z A-Z 0-9' : validationResult;
      },
      initial: functionName,
    }),
  };
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
