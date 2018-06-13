const subcommand = 'remove';
const category = 'auth';

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { awsmobile, parameters } = context;
    const resourceName = parameters.first;

    return awsmobile.removeResource(context, category, resourceName);
  },
};
