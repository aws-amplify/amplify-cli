import { $TSContext } from 'amplify-cli-core';
import { startWatcher } from '../../provider-utils/awscloudformation/utils/watch';

const subcommand = 'watch';

module.exports = {
  name: subcommand,
  alias: ['hotswap'],
  run: async (context: $TSContext) => {
    return startWatcher(context).catch(err => {
      context.print.info(err.stack);
      context.print.error('There was an error watching the function code');
      context.usageData.emitError(err);
      process.exitCode = 1;
    });
  },
};
