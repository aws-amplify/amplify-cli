import { executePrompt, InputPrompt, SelectPrompt } from 'amplify-cli-core';

const ENV_NAME_INPUT_MESSAGE = 'Enter a name for the environment';
// const ENV_NAME_MESSAGE = 'Environment name';
const ENV_NAME_SELECT_MESSAGE = 'Choose the environment you would like to use:';
// const ENV_NAME_MESSAGE = 'Choose your environment';
export const INVALID_ENV_NAME_MSG = 'Environment name must be between 2 and 10 characters, and lowercase only.';

function constructEnvNameInputQuestion(initialEnvName, isEnvNameValid): InputPrompt {
  const envQuestionName = 'inputEnvName';
  const envQuestion = new InputPrompt(envQuestionName, ENV_NAME_INPUT_MESSAGE, initialEnvName, isEnvNameValid, INVALID_ENV_NAME_MSG);
  return envQuestion;
}

export async function envNameInput(initialEnvName, isEnvNameValid) {
  const envNameQuestion = constructEnvNameInputQuestion(initialEnvName, isEnvNameValid);
  const answer = await executePrompt(envNameQuestion);
  return answer;
}

function constructEnvNameSelectQuestion(envChoices, defaultEnv?) {
  const envQuestionName = 'selectEnvName';
  const envQuestion = new SelectPrompt(envQuestionName, ENV_NAME_SELECT_MESSAGE, envChoices, defaultEnv);
  return envQuestion;
}

export async function envNameSelect(envChoices, defaultEnv?) {
  const envNameQuestion = constructEnvNameSelectQuestion(envChoices, defaultEnv);
  const answer = await executePrompt(envNameQuestion);
  return answer;
}
