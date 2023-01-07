import { v4 as uuid } from 'uuid';
import { FunctionParameters } from 'amplify-function-plugin-interface';
import { advancedSettingsList } from '../utils/constants';
import { prompter } from 'amplify-prompts';

/**
 * Asks general questions about the function and populates corresponding FunctionParameters
 * @param context The Amplify Context object
 */
export async function generalQuestionsWalkthrough(context: any): Promise<Partial<FunctionParameters>> {
  const appName = context.amplify
    .getProjectDetails()
    .projectConfig.projectName.toLowerCase()
    .replace(/[^0-9a-zA-Z]/gi, '');
  const [shortId] = uuid().split('-');
  const initial = `${appName}${shortId}`;

  return {
    functionName: await prompter.input('Provide an AWS Lambda function name:', {
      validate: context.amplify.inputValidation({
        operator: 'regex',
        value: '^[a-zA-Z0-9]+$',
        onErrorMsg: 'You can use the following characters: a-z A-Z 0-9',
        required: true,
      }),
      initial,
    }),
  };
}

export async function settingsUpdateSelection() {
  return [await prompter.pick('Which setting do you want to update?', advancedSettingsList)];
}
