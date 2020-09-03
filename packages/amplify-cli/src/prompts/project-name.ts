import { InputPrompt, validatorFunction } from 'amplify-cli-core';

const PROMPT_NAME = 'inputProjectName';
const PROMPT_MESSAGE = 'Enter a name for the project';
// const PROJECT_NAME_MESSAGE = 'Project name';
const INVALID_MESSAGE = 'Project name should be between 3 and 20 characters and alphanumeric';

function constructProjectNamePrompt(initialProjectName: string, isProjectNameValid: validatorFunction): InputPrompt {
  const projectQuestion = new InputPrompt(PROMPT_NAME, PROMPT_MESSAGE, initialProjectName, isProjectNameValid, INVALID_MESSAGE);
  return projectQuestion;
}

export async function projectNameInput(initialProjectName: string, isProjectNameValid: validatorFunction): Promise<string> {
  const answer = constructProjectNamePrompt(initialProjectName, isProjectNameValid).run(false);
  return answer;
}
