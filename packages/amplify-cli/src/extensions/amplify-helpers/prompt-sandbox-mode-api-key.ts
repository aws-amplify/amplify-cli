import chalk from 'chalk';
import { $TSContext } from 'amplify-cli-core';
import { promptToAddApiKey } from 'amplify-category-api';
import { globalSandboxModeEnabled, showGlobalSandboxModeWarning } from './show-global-sandbox-mode-warning';
import { apiKeyIsActive, hasApiKey } from './get-api-key-config';

export async function promptSandboxModeApiKey(context: $TSContext): Promise<void> {
  if (globalSandboxModeEnabled(context)) {
    if (!apiKeyIsActive() || !hasApiKey()) {
      context.print.info(`
⚠️  WARNING: Global Sandbox Mode has been enabled, which requires a valid API key. If
you'd like to disable, remove ${chalk.green('"type AMPLIFY_GLOBAL @allow_public_data_access_with_api_key"')}
from your GraphQL schema and run 'amplify push' again. If you'd like to proceed with
sandbox mode disabled in '${context.amplify.getEnvInfo().envName}', do not create an API Key.
`);
      await promptToAddApiKey(context);
    } else showGlobalSandboxModeWarning(context);
  }
}
