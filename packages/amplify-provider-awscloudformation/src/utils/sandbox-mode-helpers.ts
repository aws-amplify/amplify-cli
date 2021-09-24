import chalk from 'chalk';
import { $TSContext } from 'amplify-cli-core';
import { promptToAddApiKey } from 'amplify-category-api';
import { getApiKeyConfig, apiKeyIsActive, hasApiKey } from './api-key-helpers';
import { printer } from 'amplify-prompts';

export async function showSandboxModePrompts(context: $TSContext): Promise<any> {
  if (!hasApiKey() || !apiKeyIsActive()) {
    printer.info(
      `
⚠️  WARNING: Global Sandbox Mode has been enabled, which requires a valid API key. If
you'd like to disable, remove ${chalk.green('"type AMPLIFY_GLOBAL @allow_public_data_access_with_api_key"')}
from your GraphQL schema and run 'amplify push' again. If you'd like to proceed with
sandbox mode disabled in '${context.amplify.getEnvInfo().envName}', do not create an API Key.
`,
      'yellow',
    );
    return await promptToAddApiKey(context);
  } else {
    showGlobalSandboxModeWarning();
    return;
  }
}

export function showGlobalSandboxModeWarning(): void {
  const { apiKeyExpirationDate } = getApiKeyConfig();

  if (!apiKeyExpirationDate) return;

  const expirationDate = new Date(apiKeyExpirationDate);

  printer.info(
    `
⚠️  WARNING: ${chalk.green('"type AMPLIFY_GLOBAL @allow_public_data_access_with_api_key"')} in your GraphQL schema
allows public create, read, update, and delete access to all models via API Key. This
should only be used for testing purposes. API Key expiration date is: ${expirationDate.toLocaleDateString()}

To configure PRODUCTION-READY authorization rules, review: https://docs.amplify.aws/cli/graphql-transformer/auth
`,
    'yellow',
  );
}

export function getSandboxModeEnvNameFromDirectiveSet(input: any): string {
  const sandboxModeDirective = input.find((el: any) => el.name.value === 'allow_public_data_access_with_api_key');

  if (!sandboxModeDirective) return '';

  const inField = sandboxModeDirective.arguments.find((el: any) => el.name.value === 'in');
  return inField.value.value;
}
