const subcommand = 'remove';
const category = 'api';

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify.removeResource(context, category, resourceName)
      .then(() => context.print.success('Successfully removed resource'))
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error removing the api resource');
      });
  },
};
