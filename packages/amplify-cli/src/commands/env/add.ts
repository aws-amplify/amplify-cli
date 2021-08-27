import { $TSContext, stateManager } from 'amplify-cli-core';
import { run as init } from '../init';

export const run = async (context: $TSContext) => {
  await init(context);
};
