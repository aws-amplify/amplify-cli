import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { runHelp, commandsInfo } from '@aws-amplify/amplify-cli-core';

/**
 * displays amplify help menu
 */
export const run = async (context: $TSContext): Promise<void> => {
  runHelp(context, commandsInfo);
};
