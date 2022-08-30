import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { ensureEnvMeta, listLocalEnvNames } from '@aws-amplify/amplify-environment-parameters';
import { printEnvInfo } from '../helpers/envUtils';

/**
 * Prints environment info
 */
export const run = async (context: $TSContext): Promise<void> => {
  const envName = context.parameters.options.name;

  if (!envName) {
    throw new Error(`Pass in the name of the environment using the --name flag`);
  }

  const allEnvs = listLocalEnvNames();
  if (!allEnvs.includes(envName)) {
    throw new Error(`Cannot find environment ${envName}. Make sure the environment has been pulled using 'amplify pull'.`);
  }

  printer.info(envName);
  printEnvInfo(await ensureEnvMeta(context, envName));
};
