import { InputPrompt, validatorFunction } from 'amplify-cli-core';

const PROMPT_NAME = 'inputEnvName';
const PROMPT_MESSAGE = 'Enter a name for the environment';
// const ENV_NAME_MESSAGE = 'Environment name';
export const INVALID_ENV_NAME_MESSAGE = 'Environment name must be between 2 and 10 characters, and lowercase only.';

function constructEnvNameInputQuestion(initialEnvName: string, isEnvNameValid: validatorFunction): InputPrompt {
  const envQuestion = new InputPrompt(PROMPT_NAME, PROMPT_MESSAGE, initialEnvName, isEnvNameValid, INVALID_ENV_NAME_MESSAGE);
  return envQuestion;
}

export async function envNameInput(initialEnvName: string, isEnvNameValid: validatorFunction): Promise<string> {
  const answer = constructEnvNameInputQuestion(initialEnvName, isEnvNameValid).run();
  return answer;
}
