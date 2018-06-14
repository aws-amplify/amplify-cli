const subcommand = 'push';
const category = 'auth';

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { awsmobile, parameters } = context;
    const resourceName = parameters.first;

    return awsmobile.pushResources(context, category, resourceName);
  },
};
