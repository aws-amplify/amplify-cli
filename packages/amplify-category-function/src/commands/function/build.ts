import { categoryName } from '../../provider-utils/awscloudformation/utils/constants';

const subcommand = 'build';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify.buildResources(context, categoryName, resourceName).catch(err => {
      context.print.info(err.stack);
      context.print.error('There was an error building the function resources');
    });
  },
};
