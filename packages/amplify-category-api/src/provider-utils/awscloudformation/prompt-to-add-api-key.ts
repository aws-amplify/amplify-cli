import { $TSContext } from 'amplify-cli-core';
import { askApiKeyQuestions } from './service-walkthroughs/appSync-walkthrough';
import { authConfigToAppSyncAuthType } from './utils/auth-config-to-app-sync-auth-type-bi-di-mapper';
import { getCfnApiArtifactHandler } from './cfn-api-artifact-handler';
import { prompter } from 'amplify-prompts';

export async function promptToAddApiKey(context: $TSContext): Promise<any> {
  if (await prompter.confirmContinue('Would you like to create an API Key?')) {
    const apiKeyConfig = await askApiKeyQuestions();
    const authConfig = [apiKeyConfig];

    await getCfnApiArtifactHandler(context).updateArtifacts(
      {
        version: 1,
        serviceModification: {
          serviceName: 'AppSync',
          additionalAuthTypes: authConfig.map(authConfigToAppSyncAuthType),
        },
      },
      {
        skipCompile: true,
      },
    );

    return apiKeyConfig;
  }
}
