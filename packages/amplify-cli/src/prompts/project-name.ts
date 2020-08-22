import { prompt } from 'enquirer';

export async function projectNameInput(initialProjectName, isProjectNameValid) {
  const projectNamePrompt = {
    type: 'input',
    name: 'inputProjectName',
    message: 'Enter a name for the project',
    initial: initialProjectName,
    validate: input => isProjectNameValid(input) || 'Project name should be between 3 and 20 characters and alphanumeric',
  };
  const answer: { inputProjectName: string } = await prompt(projectNamePrompt);
  return answer.inputProjectName;
}
