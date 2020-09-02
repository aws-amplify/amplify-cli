import { MultiSelectPrompt, Choice } from 'amplify-cli-core';

const PROMPT_NAME = 'multiSelectProvider';
const PROMPT_MESSAGE = 'Select the backend providers.';

function constructProviderMultiSelectQuestion(providerPluginList: string[] | Choice[], defaultProvider?: string): MultiSelectPrompt {
  const providerQuestion = new MultiSelectPrompt(PROMPT_NAME, PROMPT_MESSAGE, providerPluginList, defaultProvider);
  return providerQuestion;
}

export async function providersMultiSelect(providerPluginList: string[] | Choice[], defaultProvider?: string): Promise<string[]> {
  const answer = await constructProviderMultiSelectQuestion(providerPluginList, defaultProvider).run();
  return answer;
}
