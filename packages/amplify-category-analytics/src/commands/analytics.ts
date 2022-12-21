import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

export { run as analyticsPush } from './analytics/push';
export const name = 'analytics';

/**
 * Analytics category command router. Invokes functionality for all CLI calls
 * @param context amplify cli context
 */
export const run = async (context: $TSContext): Promise<$TSAny> => {
  if (/^win/.test(process.platform)) {
    const { run: runCommand } = await import(`./${name}/${context.parameters.first}`);
    return runCommand(context);
  }
  const header = `amplify ${name} <subcommand>`;

  const commands = [
    {
      name: 'add',
      description: `Takes you through a CLI flow to add an ${name} resource to your local backend`,
    },
    {
      name: 'update',
      description: `Takes you through steps in the CLI to update an ${name} resource`,
    },
    {
      name: 'push',
      description: `Provisions only ${name} cloud resources with the latest local developments`,
    },
    {
      name: 'remove',
      description: `Removes ${name} resource from your local backend. The resource is removed from the cloud on the next push command.`,
    },
    {
      name: 'console',
      description: `Opens the web console for the ${name} category`,
    },
  ];

  context.amplify.showHelp(header, commands);
  printer.blankLine();
  return context;
};
