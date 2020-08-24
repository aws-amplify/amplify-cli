import { prompt } from 'enquirer';
import { InputPrompt } from '../prompts';

const inputQuestionName = 'inputProjectName';
export const PROJECT_NAME_MESSAGE = 'Enter a name for the project';
export const INVALID_PROJECT_NAME_MESSAGE = 'Project name should be between 3 and 20 characters and alphanumeric';

export function constructProjectNameQuestion(initialProjectName, isProjectNameValid) {
  const projectNameQuestion = new InputPrompt(
    inputQuestionName,
    PROJECT_NAME_MESSAGE,
    initialProjectName,
    isProjectNameValid,
    INVALID_PROJECT_NAME_MESSAGE,
  );
  return projectNameQuestion;
}

export async function projectNameInput(initialProjectName, isProjectNameValid) {
  const projectNameQuestion = constructProjectNameQuestion(initialProjectName, isProjectNameValid);
  const answer = await prompt(projectNameQuestion);
  return answer[inputQuestionName];
}
