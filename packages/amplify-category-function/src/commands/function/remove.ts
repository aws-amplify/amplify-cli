import { categoryName } from '../../provider-utils/awscloudformation/utils/constants';

const subcommand = 'remove';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify.removeResource(context, categoryName, resourceName).catch(err => {
      context.print.info(err.stack);
      context.print.error('An error occurred when removing the function resource');
    });
  },
};
