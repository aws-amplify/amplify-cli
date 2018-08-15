const subcommand = 'push';
const category = 'storage';

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify.pushResources(context, category, resourceName)
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('An error occurred when pushing the storage resource');
      });
  },
};
