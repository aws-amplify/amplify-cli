import { $TSContext, AmplifyCategories, AmplifySupportedService } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';

const subcommand = 'remove';
const gqlConfigFilename = '.graphqlconfig.yml';

export const name = subcommand;

export const run = async (context: $TSContext) => {
  const resourceName = context.parameters.first;

  const resourceValues = await context.amplify.removeResource(context, AmplifyCategories.API, resourceName, {
    serviceSuffix: { [AmplifySupportedService.APPSYNC]: '(GraphQL API)', [AmplifySupportedService.APIGW]: '(REST API)' },
  });
  try {
    if (!resourceValues) {
      return;
    } // indicates that the customer selected "no" at the confirmation prompt
    if (resourceValues.service === AmplifySupportedService.APPSYNC) {
      const { projectPath } = context.amplify.getEnvInfo();

      const gqlConfigFile = path.normalize(path.join(projectPath, gqlConfigFilename));
      context.filesystem.remove(gqlConfigFile);
    }
  } catch (err) {
    printer.error('There was an error removing the api resource');
    throw err;
  }
};
