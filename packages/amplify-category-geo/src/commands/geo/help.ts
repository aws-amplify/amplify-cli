import { $TSContext, runHelp, commandsInfo } from '@aws-amplify/amplify-cli-core';

export const run = (context: $TSContext) => {
  runHelp(context, commandsInfo);
};
