import chalk from 'chalk';
import { JSONUtilities, $TSContext, UnknownArgumentError, exitOnNextTick } from 'amplify-cli-core';
import { printEnvInfo } from '../helpers/envUtils';

export const run = async (context: $TSContext) => {
  const envName = context.parameters.options.name;

  if (!envName) {
    const errMessage = 'You must pass in the name of the environment using the --name flag';
    context.print.error(errMessage);
    context.usageData.emitError(new UnknownArgumentError(errMessage));
    exitOnNextTick(1);
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
      printEnvInfo(context, env, allEnvs);
    }
  });

  if (!envFound) {
    context.print.error('No environment found with the corresponding name provided');
  }
};
