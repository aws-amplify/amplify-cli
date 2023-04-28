import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { start } from '../../api';
export const name = 'api';

export const run = async (context: $TSContext) => {
  if (context.parameters.options.help) {
    const header = `amplify mock ${name} \nDescription:
    Mock GraphQL API locally`;
    context.amplify.showHelp(header, []);
    return;
  }
  try {
    // added here to get the Env info before starting to mock
    await context.amplify.getEnvInfo();
    await start(context);
  } catch (e) {
    context.print.error(`Failed to start API Mocking.`);
    if (e.resolution == undefined || e.link == undefined) {
      context.print.red(`Reason: ${e.message}`);
    } else {
      context.print.red(`Reason: ${e.message}\nResolution: ${e.resolution}`);
      context.print.green(`For troubleshooting guide, visit: ${e.link}`);
    }
  }
};
