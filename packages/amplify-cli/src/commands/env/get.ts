import { JSONUtilities, $TSContext, AmplifyError } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { printEnvInfo } from '../helpers/envUtils';

/**
 * Executes the 'env get' command
 */
export const run = async (context: $TSContext) : Promise<void> => {
  const envName = context.parameters.options.name;
  const allEnvs = context.amplify.getEnvDetails();

  if (!envName) {
    throw new AmplifyError('EnvironmentNameError', {
      message: 'Environment name was not specified.',
      resolution: 'Pass in the name of the environment using the --name flag.',
    });
  }
  if (!allEnvs[envName]) {
    throw new AmplifyError('EnvironmentNameError', {
      message: 'Environment name is invalid.',
      resolution: 'Run amplify env list to get a list of valid environments.',
    });
  }

  if (context.parameters.options.json) {
    printer.info(JSONUtilities.stringify(allEnvs[envName]) as string);
    return;
  }

  printer.blankLine();
  printer.info(envName, 'red');
  printEnvInfo(envName, allEnvs);
};
