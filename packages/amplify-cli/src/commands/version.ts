import { printer } from 'amplify-prompts';
import { Context } from '../domain/context';

export const run = (context: Context) => {
  printer.info(context.versionInfo.currentCLIVersion);
};
