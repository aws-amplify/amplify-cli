import { initializeEnv } from '../../initialize-env';

export const run = async context => {
  context.amplify.constructExeInfo(context);
  context.exeInfo.forcePush = false;
  context.exeInfo.restoreBackend = context.parameters.options.restore;
  await initializeEnv(context);
};
