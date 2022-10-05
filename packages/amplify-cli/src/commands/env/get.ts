import { $TSContext, AmplifyError } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { ensureEnvMeta, ensureEnvParamManager, listLocalEnvNames } from '@aws-amplify/amplify-environment-parameters';
import { printEnvInfo } from '../helpers/envUtils';

/**
 * Executes the 'env get' command
 */
export const run = async (context: $TSContext) : Promise<void> => {
  const envName = context.parameters.options.name;

  if (!envName) {
    throw new AmplifyError('EnvironmentNameError', {
      message: 'Environment name was not specified.',
      resolution: 'Pass in the name of the environment using the --name flag.',
    });
  }

  const allEnvs = listLocalEnvNames();
  if (!allEnvs.includes(envName)) {
    throw new AmplifyError('EnvironmentNameError', {
      message: 'Environment name is invalid.',
      resolution: 'Run amplify env list to get a list of valid environments.',
    });
  }

  if (context.parameters.options.json) {
    // merge meta and params from env into one json and print it
    printer.info(JSON.stringify(await constructEnvMetaAndParamsObject(context, envName), undefined, 2));
  } else {
    printer.blankLine();
    printer.info(envName, 'blue');
    (await ensureEnvMeta(context, envName)).write(false, printEnvInfo);
  }
};

/**
 * Constructs an object that is identical to what would be in the team-provider-info file but without relying on the contents of the file
 *
 * This is in preparation for when the team-provider-info file no longer exists but we neeed to maintain the behavior of the
 * `env get --details --json` command
 * @param context Amplify context object
 * @param envName The environmnet to construct metadata for
 * @returns The environment metadata object (both amplify meta and environment parameters)
 */
export const constructEnvMetaAndParamsObject = async (context: $TSContext, envName: string): Promise<Record<string, unknown>> => {
  const result: Record<string, unknown> = {};
  (await ensureEnvMeta(context, envName)).write(false, obj => {
    result.awscloudformation = obj;
  });
  (await ensureEnvParamManager(envName)).instance.write(obj => {
    if (Object.keys(obj).length > 0) {
      result.categories = obj;
    }
  });
  return result;
};
