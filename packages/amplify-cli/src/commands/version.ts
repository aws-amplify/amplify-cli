import { Context } from '../domain/context';

export const run = (context: Context) => {
  context.print.info(context.versionInfo.currentCLIVersion);
};
