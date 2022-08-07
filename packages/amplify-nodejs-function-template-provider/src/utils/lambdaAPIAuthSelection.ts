import {
  printer, prompter,
} from '../../../amplify-prompts';

const choices = ["IAM", "API_KEY"];

/**
 * Allows the user to select the type of authentication to use for the AppSync Todo Lambda function 
 */
export async function lambdaAPIAuthSelection(): Promise<{ selection: string }> {
  printer.info('Select the type of authentication to use for the AppSync Todo Lambda function');
  
  const selected = await prompter.pick('Pick a Auth type', choices)

  return {
    selection: selected,
  };
}
