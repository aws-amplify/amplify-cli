import { $TSContext } from 'amplify-cli-core';
import { executeProviderCommand } from 'amplify-cli-core';

export const run = async (context: $TSContext) => {
  await executeProviderCommand(context, 'updateEnv');
};
