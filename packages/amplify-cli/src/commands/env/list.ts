import { $TSContext } from 'amplify-cli-core';
import { ensureEnvMeta, listLocalEnvNames } from '@aws-amplify/amplify-environment-parameters';
import { formatter, printer } from 'amplify-prompts';
import { printEnvInfo } from '../helpers/envUtils';

/**
 * Prints env info
 */
export const run = async (context: $TSContext): Promise<void> => {
  const { envName: currentEnvName } = context.amplify.getEnvInfo();

  const allEnvNames = listLocalEnvNames();

  if (context.parameters.options.details) {
    printDetailedEnvList(context, allEnvNames, currentEnvName);
  } else {
    printShortEnvList(allEnvNames, currentEnvName);
  }
};

const printDetailedEnvList = async (context: $TSContext, envList: string[], currentEnv: string): Promise<void> => {
  printer.info('Environments:');
  for (const envName of envList) {
    printer.info(envName === currentEnv ? `*${envName}*` : envName);
    printEnvInfo(await ensureEnvMeta(context, envName));
  }
};

const printShortEnvList = (allEnvNames: string[], currentEnv: string): void => {
  printer.info('Environments:');
  formatter.list(allEnvNames.map(envName => (envName === currentEnv ? `*${envName}*` : envName)));
};
