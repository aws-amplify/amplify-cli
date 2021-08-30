import chalk from 'chalk';
import { askApiKeyQuestions } from './service-walkthroughs/appSync-walkthrough';
import { authConfigToAppSyncAuthType } from './utils/auth-config-to-app-sync-auth-type-bi-di-mapper';
import { getCfnApiArtifactHandler } from './cfn-api-artifact-handler';
import { $TSContext } from 'amplify-cli-core';

export async function promptToAddApiKey(context: $TSContext): Promise<void> {
  context.print.info(`
⚠️  WARNING: Global Sandbox Mode has been enabled, which requires a valid API key. If
you'd like to disable, remove ${chalk.green('"type AMPLIFY_GLOBAL @allow_public_data_access_with_api_key"')}
from your GraphQL schema and run 'amplify push' again. If you'd like to proceed with
sandbox mode disabled in '${context.amplify.getEnvInfo().envName}', do not create an API Key.
`);
  if (await context.prompt.confirm('Would you like to create an API Key?', true)) {
    const apiKeyConfig = await askApiKeyQuestions();
    const authConfig = [apiKeyConfig];

    getCfnApiArtifactHandler(context).updateArtifactsWithoutCompile({
      version: 1,
      serviceModification: {
        serviceName: 'AppSync',
        additionalAuthTypes: authConfig.map(authConfigToAppSyncAuthType),
      },
    });
  }
}
