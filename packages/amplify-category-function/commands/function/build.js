const subcommand = 'build';
const category = 'function';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify.buildResources(context, category, resourceName).catch(err => {
      context.print.info(err.stack);
      context.print.error('There was an error building the function resources');
    });
  },
};
