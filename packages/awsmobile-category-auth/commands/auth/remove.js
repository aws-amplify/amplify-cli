const subcommand = 'remove';
const category = 'auth';

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { awsmobile, parameters } = context;
    const resourceName = parameters.first;

    return awsmobile.removeResource(context, category, resourceName)
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error removing the auth resource');
      });
  },
};
