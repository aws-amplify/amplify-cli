import { $TSContext } from 'amplify-cli-core';
import { start } from '../../auth';

export const name = 'auth';

/**
 * Run command for mock auth
 */
export const run = async (context: $TSContext) :Promise<void> => {
  if (context.parameters.options.help) {
    const header = `amplify mock ${name} \nDescriptions:
    Mock Auth locally`;
    context.amplify.showHelp(header, []);
    return;
  }
  try {
    await start(context);
  } catch (e) {
    context.print.error(e.message);
  }
};
