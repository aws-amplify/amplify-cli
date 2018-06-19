const subcommand = 'push';
const category = 'storage';

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { awsmobile, parameters } = context;
    const resourceName = parameters.first;

    return awsmobile.pushResources(context, category, resourceName)
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error pushing the storage resource');
      });
  },
};
