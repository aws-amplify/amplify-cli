import { categoryName } from '../../provider-utils/awscloudformation/utils/constants';

const subcommand = 'console';

module.exports = {
  name: subcommand,
  run: async context => {
    context.print.info(`to be implemented: ${categoryName} ${subcommand}`);
  },
};
