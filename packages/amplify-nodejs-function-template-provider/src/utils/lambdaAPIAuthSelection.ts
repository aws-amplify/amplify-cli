/* eslint-disable */
import {
  $TSContext, AmplifyCategories, JSONUtilities, pathManager, stateManager,
} from 'amplify-cli-core';
import {
  printer, byValue, prompter, alphanumeric, and, integer, minLength,
} from '../../../amplify-prompts';

const printResult = (result: any) => console.log(`Prompt result was [${result}]`);
const choices = ["IAM", "API_KEY"];

/**
 * Allows the user to select the type of authentication to use for the AppSync Todo Lambda function 
 */
export async function lambdaAPIAuthSelection(): Promise<{ selection: string }> {
  printer.info('Select the type of authentication to use for the AppSync Todo Lambda function');
  
  const selected = await prompter.pick('Pick your favorite Skittle color', choices)
  printResult("Selected: " + selected);

  return {
    selection: selected,
  };
}
