import { $TSContext } from 'amplify-cli-core';
import { askApiKeyQuestions } from './service-walkthroughs/appSync-walkthrough';
import { authConfigToAppSyncAuthType } from './utils/auth-config-to-app-sync-auth-type-bi-di-mapper';
import { getCfnApiArtifactHandler } from './cfn-api-artifact-handler';

export async function promptToAddApiKey(context: $TSContext): Promise<void> {
  if (await context.prompt.confirm('Would you like to create an API Key?', true)) {
    const apiKeyConfig = await askApiKeyQuestions();
    const authConfig = [apiKeyConfig];

    await getCfnApiArtifactHandler(context).updateArtifactsWithoutCompile({
      version: 1,
      serviceModification: {
        serviceName: 'AppSync',
        additionalAuthTypes: authConfig.map(authConfigToAppSyncAuthType),
      },
    });
  }
}
