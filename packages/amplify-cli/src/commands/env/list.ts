import chalk from 'chalk';
import { JSONUtilities } from 'amplify-cli-core';
import { printEnvInfo } from '../helpers/envUtils';

export const run = async context => {
  const { envName } = context.amplify.getEnvInfo();

  if (context.parameters.options.details) {
    const allEnvs = context.amplify.getEnvDetails();
    if (context.parameters.options.json) {
      context.print.fancy(JSONUtilities.stringify(allEnvs));
      return;
    }
    Object.keys(allEnvs).forEach(env => {
      context.print.info('');
      if (envName === env) {
        context.print.info(chalk.red(`*${env}*`));
      } else {
        context.print.info(chalk.yellow(env));
      }
      printEnvInfo(context, env, allEnvs);
    });
  } else {
    const allEnvs = context.amplify.getAllEnvs();
    if (context.parameters.options.json) {
      context.print.fancy(JSONUtilities.stringify({ envs: allEnvs }));
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
    context.print.info('');
    table(tableOptions, { format: 'markdown' });
    context.print.info('');
  }
};
