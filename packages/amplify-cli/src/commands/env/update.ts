import { $TSContext } from 'amplify-cli-core';
import { executeProviderCommand } from '../../extensions/amplify-helpers/get-provider-plugins';

export const run = async (context: $TSContext) => {
  await executeProviderCommand(context, 'updateEnv');
  context.print.info(
    'Environment configuration will be updated on the next `amplify push`.\nIf there are no other project changes, run `amplify push --force` to push environment configuration chnages.',
  );
};
