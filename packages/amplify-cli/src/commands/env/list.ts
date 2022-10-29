import { JSONUtilities } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { printEnvInfo } from '../helpers/envUtils';

/**
 * Executes the 'env list' command
 */
export const run = async (context): Promise<void> => {
  const { envName } = context.amplify.getEnvInfo();

  if (context.parameters.options.details) {
    const allEnvs = context.amplify.getEnvDetails();
    if (context.parameters.options.json) {
      printer.info(JSONUtilities.stringify(allEnvs) as string);
      return;
    }
    Object.keys(allEnvs).forEach(env => {
      printer.blankLine();
      if (envName === env) {
        printer.info(`*${env}*`, 'red');
      } else {
        printer.info(env, 'yellow');
      }
      printEnvInfo(env, allEnvs);
    });
  } else {
    const allEnvs = context.amplify.getAllEnvs();
    if (context.parameters.options.json) {
      printer.info(JSONUtilities.stringify({ envs: allEnvs }) as string);
      return;
    }
    const { table } = context.print;
    const tableOptions = [['Environments']];
    for (let i = 0; i < allEnvs.length; i += 1) {
      if (allEnvs[i] === envName) {
        tableOptions.push([`*${allEnvs[i]}`]);
      } else {
        tableOptions.push([allEnvs[i]]);
      }
    }
    printer.blankLine();
    table(tableOptions, { format: 'markdown' });
    printer.blankLine();
  }
};
