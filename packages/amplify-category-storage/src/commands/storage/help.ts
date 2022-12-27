import { $TSContext } from 'amplify-cli-core';
import { runHelp, commandsInfo } from 'amplify-cli-core';

export const run = (context: $TSContext) => {
    runHelp(context, commandsInfo);
};