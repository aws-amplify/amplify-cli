import { $TSContext } from 'amplify-cli-core';
import { raisePostEnvAddEvent } from '../../execution-manager';
import { run as init } from '../init';

export const run = async (context: $TSContext) => {
  await init(context);
  await raisePostEnvAddEvent(context as any, context.exeInfo.sourceEnvName, context.exeInfo.localEnvInfo.envName);
};
