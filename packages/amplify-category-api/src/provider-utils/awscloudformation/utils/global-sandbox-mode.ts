import { $TSContext } from 'amplify-cli-core';

export function defineGlobalSandboxMode(context: $TSContext): string {
  const envName = context.amplify.getEnvInfo().envName;

  return `# This allows public create, read, update, and delete access for a limited time to all models via API Key.
# To configure PRODUCTION-READY authorization rules, review: https://docs.amplify.aws/cli/graphql-transformer/auth
type AMPLIFY_GLOBAL @allow_public_data_access_with_api_key(in: \"${envName}\") # FOR TESTING ONLY!\n
`;
}
