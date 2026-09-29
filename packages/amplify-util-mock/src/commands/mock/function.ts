import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { start } from '../../func';

export const name = 'function';

export const run = async (context: $TSContext) => {
  if (context.parameters.options.help) {
    const header = `amplify mock ${name} \nDescriptions:
    Mock Functions locally`;
    context.amplify.showHelp(header, []);
    return;
  }
  try {
    await start(context);
  } catch (e) {
    context.print.error(e.message);
  }
};
