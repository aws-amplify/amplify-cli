import chalk from 'chalk';
import { $TSContext } from 'amplify-cli-core';
import { getAppSyncApiConfig, getApiKeyConfig } from './get-api-key-config';

export function globalSandboxModeEnabled(context: $TSContext): boolean {
  const appSyncApi = getAppSyncApiConfig();
  const currEnvName = context.amplify.getEnvInfo().envName;
  const { globalSandboxModeConfig } = appSyncApi?.output || {};

  if (!globalSandboxModeConfig) return false;

  return globalSandboxModeConfig.env === currEnvName;
}

export function showGlobalSandboxModeWarning(context: $TSContext): void {
  const apiKeyConfig = getApiKeyConfig();

  if (!apiKeyConfig?.apiKeyExpirationDate) return;

  const expirationDate = new Date(apiKeyConfig.apiKeyExpirationDate);

  if (apiKeyConfig && globalSandboxModeEnabled(context)) {
    context.print.info(`
${chalk.yellow(`⚠️  WARNING: ${chalk.green('"type AMPLIFY_GLOBAL @allow_public_data_access_with_api_key"')} in your GraphQL schema
allows public create, read, update, and delete access to all models via API Key. This
should only be used for testing purposes. API Key expiration date is: ${expirationDate.toLocaleDateString()}

To configure PRODUCTION-READY authorization rules, review: https://docs.amplify.aws/cli/graphql-transformer/auth`)}
`);
  }
}
