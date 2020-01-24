const subcommand = 'remove';
const category = 'layer';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify.removeResource(context, category, resourceName).catch(err => {
      context.print.info(err.stack);
      context.print.error('An error occurred when removing the layer resource');
    });
  },
};
