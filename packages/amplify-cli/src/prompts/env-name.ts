import { InputPrompt, SelectPrompt, validatorFunction, Choice } from 'amplify-cli-core';

const PROMPT_NAME_INPUT = 'inputEnvName';
const PROMPT_MESSAGE_INPUT = 'Enter a name for the environment';
// const ENV_NAME_MESSAGE = 'Environment name';
const PROMPT_NAME_SELECT = 'selectEnvName';
const PROMPT_MESSAGE_SELECT = 'Choose the environment you would like to use:';
// const ENV_NAME_MESSAGE = 'Choose your environment';
export const INVALID_ENV_NAME_MESSAGE = 'Environment name must be between 2 and 10 characters, and lowercase only.';

function constructEnvNameInputQuestion(initialEnvName: string, isEnvNameValid: validatorFunction): InputPrompt {
  const envQuestion = new InputPrompt(PROMPT_NAME_INPUT, PROMPT_MESSAGE_INPUT, initialEnvName, isEnvNameValid, INVALID_ENV_NAME_MESSAGE);
  return envQuestion;
}

export async function envNameInput(initialEnvName: string, isEnvNameValid: validatorFunction): Promise<string> {
  const answer = constructEnvNameInputQuestion(initialEnvName, isEnvNameValid).run();
  return answer;
}

function constructEnvNameSelectQuestion(envChoices: string[] | Choice[], defaultEnv?: string): SelectPrompt {
  const envQuestion = new SelectPrompt(PROMPT_NAME_SELECT, PROMPT_MESSAGE_SELECT, envChoices, defaultEnv);
  return envQuestion;
}

export async function envNameSelect(envChoices: string[] | Choice[], defaultEnv?: string): Promise<string> {
  const answer = constructEnvNameSelectQuestion(envChoices, defaultEnv).run();
  return answer;
}
