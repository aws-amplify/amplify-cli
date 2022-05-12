import { $TSContext, CloudformationProviderFacade } from 'amplify-cli-core';

export async function hasApiKey(context: $TSContext): Promise<boolean> {
  const apiKeyConfig = await CloudformationProviderFacade.getApiKeyConfig(context);
  return !!apiKeyConfig && !!apiKeyConfig?.apiKeyExpirationDays;
}
