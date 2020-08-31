import { executePrompt, InputPrompt, SelectPrompt, Choice } from 'amplify-cli-core';

const FRONTEND_SELECT_MESSAGE = "Choose the type of app that you're building";
// const FRONTEND_SELECT_MESSAGE = "Choose your frontend"

function constructFrontendQuestion(frontendChoices: string[] | Choice[], defaultFrontend?: string): SelectPrompt {
  const frontendQuestionName = 'select';
  const frontendQuestion = new SelectPrompt(frontendQuestionName, FRONTEND_SELECT_MESSAGE, frontendChoices, defaultFrontend);
  return frontendQuestion;
}

export async function frontendSelect(frontendChoices: string[] | Choice[], defaultFrontend?: string): Promise<string> {
  const frontendQuestion = constructFrontendQuestion(frontendChoices, defaultFrontend);
  const answer = await executePrompt(frontendQuestion);
  return answer;
}
