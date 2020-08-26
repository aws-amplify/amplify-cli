import { prompt } from 'enquirer';
import { InputPrompt } from '../prompts';

const inputQuestionName = 'inputProjectName';
const PROJECT_NAME_MESSAGE = 'Enter a name for the project';
// const PROJECT_NAME_MESSAGE = 'Project name';
const INVALID_PROJECT_NAME_MESSAGE = 'Project name should be between 3 and 20 characters and alphanumeric';

function constructProjectNameQuestion(initialProjectName, isProjectNameValid) {
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
  const answer = projectNameQuestion[inputQuestionName];
  return answer;
}
