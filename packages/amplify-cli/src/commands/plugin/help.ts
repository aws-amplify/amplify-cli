import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { runHelp, commandsInfo } from '@aws-amplify/amplify-cli-core';

export const run = (context: $TSContext) => {
  runHelp(context, commandsInfo);
};
