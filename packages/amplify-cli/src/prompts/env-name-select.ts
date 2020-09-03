import { SelectPrompt, Choice } from 'amplify-cli-core';

const PROMPT_NAME = 'selectEnvName';
const PROMPT_MESSAGE = 'Choose the environment you would like to use:';
// const ENV_NAME_MESSAGE = 'Choose your environment';

function constructEnvNameSelectPrompt(envChoices: string[] | Choice[], defaultEnv?: string): SelectPrompt {
  const envQuestion = new SelectPrompt(PROMPT_NAME, PROMPT_MESSAGE, envChoices, defaultEnv);
  return envQuestion;
}

export async function envNameSelect(envChoices: string[] | Choice[], defaultEnv?: string): Promise<string> {
  const answer = constructEnvNameSelectPrompt(envChoices, defaultEnv).run();
  return answer;
}
