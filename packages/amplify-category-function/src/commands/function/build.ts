import { category as categoryName } from '../../constants';

const subcommand = 'build';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify.buildResources(context, categoryName, resourceName).catch(err => {
      context.print.info(err.stack);
      context.print.error('There was an error building the function resources');
      context.usageData.emitError(err);
    });
  },
};
