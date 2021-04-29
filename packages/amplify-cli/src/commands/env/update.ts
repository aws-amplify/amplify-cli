import { $TSContext } from 'amplify-cli-core';
import { executeProviderCommand } from '../../extensions/amplify-helpers/get-provider-plugins';

export const run = async (context: $TSContext) => {
  return executeProviderCommand(context, 'updateEnv');
};
