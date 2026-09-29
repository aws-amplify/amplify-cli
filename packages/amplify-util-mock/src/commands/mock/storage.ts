import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { start } from '../../storage';

export const name = 'storage';

export const run = async (context: $TSContext) => {
  if (context.parameters.options.help) {
    const header = `amplify mock ${name} \nDescriptions:
    Mock Storage locally`;
    context.amplify.showHelp(header, []);
    return;
  }
  try {
    await start(context);
  } catch (e) {
    context.print.error(e.message);
  }
};
