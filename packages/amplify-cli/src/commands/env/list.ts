import { $TSContext } from 'amplify-cli-core';
import { ensureEnvMeta, listLocalEnvNames } from '@aws-amplify/amplify-environment-parameters';
import { formatter, printer } from 'amplify-prompts';
import { printEnvInfo } from '../helpers/envUtils';
import { constructEnvMetaAndParamsObject } from './get';

/**
 * Prints env info
 */
export const run = async (context: $TSContext): Promise<void> => {
  const { envName: currentEnvName } = context.amplify.getEnvInfo();

  const allEnvNames = listLocalEnvNames();

  if (context.parameters.options.details) {
    if (context.parameters.options.json) {
      const result: Record<string, unknown> = {};
      for (const envName of allEnvNames) {
        const envDetails = await constructEnvMetaAndParamsObject(context, envName);
        result[envName] = envDetails;
      }
      printer.info(JSON.stringify(result, undefined, 2));
    } else { // non json output
      printDetailedEnvList(context, allEnvNames, currentEnvName);
    }
  } else if (context.parameters.options.json) {
    printer.info(JSON.stringify({
      envs: allEnvNames,
    }, undefined, 2));
  } else {
    printShortEnvList(allEnvNames, currentEnvName);
  }
};

const printDetailedEnvList = async (context: $TSContext, envList: string[], currentEnv: string): Promise<void> => {
  printer.info('Environments:');
  for (const envName of envList) {
    printer.info(envName === currentEnv ? `*${envName}*` : envName, 'blue');
    (await ensureEnvMeta(context, envName)).write(false, printEnvInfo);
  }
};

const printShortEnvList = (allEnvNames: string[], currentEnv: string): void => {
  printer.info('Environments:');
  formatter.list(allEnvNames.map(envName => (envName === currentEnv ? `*${envName}*` : envName)));
};
