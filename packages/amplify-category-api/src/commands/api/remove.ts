import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';

const subcommand = 'remove';
const category = 'api';
const gqlConfigFilename = '.graphqlconfig.yml';

export const name = subcommand;

export const run = async (context: $TSContext) => {
  const resourceName = context.parameters.first;

  const resourceValues = await context.amplify.removeResource(context, category, resourceName);
  try {
    if (!resourceValues) {
      return;
    } // indicates that the customer selected "no" at the confirmation prompt
    if (resourceValues.service === 'AppSync') {
      const { projectPath } = context.amplify.getEnvInfo();

      const gqlConfigFile = path.normalize(path.join(projectPath, gqlConfigFilename));
      context.filesystem.remove(gqlConfigFile);
    }
  } catch (err) {
    printer.info(err.stack);
    printer.error('There was an error removing the api resource');
    await context.usageData.emitError(err);
    process.exitCode = 1;
  }
};
