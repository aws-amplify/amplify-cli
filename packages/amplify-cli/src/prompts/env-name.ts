import { prompt } from 'enquirer';

export const INVALID_ENV_NAME_MSG = 'Environment name must be between 2 and 10 characters, and lowercase only.';

export async function envNameInput(initialEnvName, isEnvNameValid) {
  const envNamePrompt = {
    type: 'input',
    name: 'inputEnvName',
    message: 'Enter a name for the environment',
    initial: initialEnvName,
    validate: input => (!isEnvNameValid(input) ? INVALID_ENV_NAME_MSG : true),
  };
  const answer: { inputEnvName: string } = await prompt(envNamePrompt);
  return answer.inputEnvName;
}

export async function envNameSelect(envChoices, defaultEnv?) {
  const envNamePrompt = {
    type: 'select',
    name: 'selectEnvName',
    message: 'Choose the environment you would like to use:',
    initial: defaultEnv,
    choices: envChoices,
  };
  const answer: { selectEnvName: string } = await prompt(envNamePrompt);
  return answer.selectEnvName;
}
