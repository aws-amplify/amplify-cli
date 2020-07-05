import { category as categoryName } from '../../constants';

const subcommand = 'push';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;
    context.amplify.constructExeInfo(context);
    return amplify.pushResources(context, categoryName, resourceName).catch(err => {
      context.print.info(err.stack);
      context.print.error('An error occurred when pushing the function resource');
      context.usageData.emitError(err);
    });
  },
};
