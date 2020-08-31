import { executePrompt, MultiSelectPrompt, Choice } from 'amplify-cli-core';

const PROVIDER_SELECT_MESSAGE = 'Select the backend providers.';

function constructProviderMultiSelectQuestion(providerPluginList: string[] | Choice[], defaultProvider?: string): MultiSelectPrompt {
  const providerQuestionName = 'multiSelectProvider';
  const providerQuestion = new MultiSelectPrompt(providerQuestionName, PROVIDER_SELECT_MESSAGE, providerPluginList, defaultProvider);
  return providerQuestion;
}

export async function providersMultiSelect(providerPluginList: string[] | Choice[], defaultProvider?: string): Promise<string[]> {
  const providerQuestion = constructProviderMultiSelectQuestion(providerPluginList, defaultProvider);
  const answer = await executePrompt(providerQuestion);
  return answer;
}
