import { InputPrompt, SelectPrompt, Choice } from 'amplify-cli-core';

const PROMPT_NAME = 'select';
const PROMPT_MESSAGE = "Choose the type of app that you're building";

function constructFrontendPrompt(frontendChoices: string[] | Choice[], defaultFrontend?: string): SelectPrompt {
  const frontendQuestion = new SelectPrompt(PROMPT_NAME, PROMPT_MESSAGE, frontendChoices, defaultFrontend);
  return frontendQuestion;
}

export async function frontendSelect(frontendChoices: string[] | Choice[], defaultFrontend?: string): Promise<string> {
  const answer = constructFrontendPrompt(frontendChoices, defaultFrontend).run();
  return answer;
}
