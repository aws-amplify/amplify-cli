/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import { $TSContext } from 'amplify-cli-core';

const featureName = 'analytics';
/**
 * Analytics category command router. Invokes functionality for all CLI calls
 * @param context amplify cli context
 */
export const analyticsRun = async (context:$TSContext): Promise<void> => {
  if (/^win/.test(process.platform)) {
    try {
      const { run } = require(`./${featureName}/${context.parameters.first}`);
      return run(context);
    } catch (e) {
      context.print.error('Command not found');
    }
  }
  const header = `amplify ${featureName} <subcommand>`;

  const commands = [
    {
      name: 'add',
      description: `Takes you through a CLI flow to add an ${featureName} resource to your local backend`,
    },
    {
      name: 'update',
      description: `Takes you through steps in the CLI to update an ${featureName} resource`,
    },
    {
      name: 'push',
      description: `Provisions only ${featureName} cloud resources with the latest local developments`,
    },
    {
      name: 'remove',
      description: `Removes ${featureName} resource from your local backend. The resource is removed from the cloud on the next push command.`,
    },
    {
      name: 'console',
      description: `Opens the web console for the ${featureName} category`,
    },
  ];

  context.amplify.showHelp(header, commands);

  context.print.info('');
};

module.exports = {
  name: featureName,
  run: analyticsRun,
};
