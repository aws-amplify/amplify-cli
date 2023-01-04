import { $TSContext, runHelp, commandsInfo } from 'amplify-cli-core';

export const run = (context: $TSContext) => {
  runHelp(context, commandsInfo);
};
