import chalk from 'chalk';
import { JSONUtilities } from 'amplify-cli-core';

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
      context.print.info('--------------');

      Object.keys(allEnvs[env]).forEach(provider => {
        if (provider !== 'nonCFNdata' && provider !== 'categories') {
          context.print.info(`Provider: ${provider}`);

          Object.keys(allEnvs[env][provider]).forEach(providerAttr => {
            context.print.info(`${providerAttr}: ${allEnvs[env][provider][providerAttr]}`);
          });

          context.print.info('--------------');
          context.print.info('');
        }
      });

      context.print.info('');
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
