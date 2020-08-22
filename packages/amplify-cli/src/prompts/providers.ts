import { prompt } from 'enquirer';

export async function providersMultiSelect(providerPluginList, defaultProvider?) {
  const providerPrompt = {
    type: 'multiselect',
    name: 'providerSelected',
    message: 'Select the backend providers.',
    choices: providerPluginList,
    initial: defaultProvider,
  };
  const answer: { providerSelected: string[] } = await prompt(providerPrompt);
  return answer.providerSelected;
}
