import { executePrompt, InputPrompt, SelectPrompt } from 'amplify-cli-core';

const FRONTEND_SELECT_MESSAGE = "Choose the type of app that you're building";
// const FRONTEND_SELECT_MESSAGE = "Choose your frontend"

function constructFrontendQuestion(frontendChoices, defaultFrontend?) {
  const frontendQuestionName = 'select';
  const frontendQuestion = new SelectPrompt(frontendQuestionName, FRONTEND_SELECT_MESSAGE, frontendChoices, defaultFrontend);
  return frontendQuestion;
}

export async function frontendSelect(frontendChoices, defaultFrontend?) {
  const frontendQuestion = constructFrontendQuestion(frontendChoices, defaultFrontend);
  const answer = await executePrompt(frontendQuestion);
  return answer;
}
