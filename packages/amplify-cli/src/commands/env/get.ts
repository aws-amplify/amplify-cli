import chalk from 'chalk';
import { JSONUtilities } from 'amplify-cli-core';

export const run = async context => {
  const envName = context.parameters.options.name;

  if (!envName) {
    context.print.error('You must pass in the name of the environment using the --name flag');
    process.exit(1);
  }

  const allEnvs = context.amplify.getEnvDetails();

  if (context.parameters.options.json) {
    if (allEnvs[envName]) {
      context.print.fancy(JSONUtilities.stringify(allEnvs[envName]));
    } else {
      context.print.fancy(JSONUtilities.stringify({ error: `No environment found with name: '${envName}'` }));
    }
    return;
  }

  let envFound = false;

  Object.keys(allEnvs).forEach(env => {
    if (env === envName) {
      envFound = true;
      context.print.info('');
      context.print.info(chalk.red(env));
      context.print.info('--------------');

      Object.keys(allEnvs[env]).forEach(provider => {
        context.print.info(`Provider: ${provider}`);

        Object.keys(allEnvs[env][provider]).forEach(providerAttr => {
          context.print.info(`${providerAttr}: ${allEnvs[env][provider][providerAttr]}`);
        });

        context.print.info('--------------');
        context.print.info('');
      });

      context.print.info('');
    }
  });

  if (!envFound) {
    context.print.error('No environment found with the corresponding name provided');
  }
};
