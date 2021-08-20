import { $TSContext } from 'amplify-cli-core';
import indexModule from '../../index';

export const subcommand = 'console';

export const run = async (context: $TSContext) => {
  await indexModule.console(context);
};
