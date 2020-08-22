import { prompt } from 'enquirer';

export async function frontendSelect(frontendChoices, defaultFrontend?) {
  const frontendNamePrompt = {
    type: 'select',
    name: 'selectFrontendName',
    message: "Choose the type of app that you're building",
    choices: frontendChoices,
    initial: defaultFrontend,
  };
  const answer: { selectFrontendName: string } = await prompt(frontendNamePrompt);
  return answer.selectFrontendName;
}
