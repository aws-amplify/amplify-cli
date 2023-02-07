import { alphanumeric, prompter } from 'amplify-prompts';
import * as uuid from 'uuid';
import { FunctionParameters } from 'amplify-function-plugin-interface';
import { $TSContext } from 'amplify-cli-core';

/**
 * Asks general questions about the function and populates corresponding FunctionParameters
 * @param context The Amplify Context object
 */
export async function generalQuestionsWalkthrough(context: $TSContext): Promise<Partial<FunctionParameters>> {
  const defaultName = getDefaultProjectNameFromContext(context);
  const lambdaFunctionName = await prompter.input('Provide an AWS Lambda function name:', {
    validate: alphanumeric('You can use the following characters: a-z A-Z 0-9'),
    initial: defaultName,
  });

  return { functionName: lambdaFunctionName };
}

export const getDefaultProjectNameFromContext = (context: $TSContext): string => {
  const appName = context.amplify
    .getProjectDetails()
    .projectConfig.projectName.toLowerCase()
    .replace(/[^0-9a-zA-Z]/gi, '');
  const [shortId] = uuid.v4().split('-');
  return `${appName}${shortId}`;
};
