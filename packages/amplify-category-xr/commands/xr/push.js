const subcommand = 'push';
const category = 'xr';

module.exports = {
  name: subcommand,
  run: async context => {
    const resourceName = context.parameters.first;
    context.amplify.constructExeInfo(context);
    return context.amplify.pushResources(context, category, resourceName).catch(err => {
      context.print.info(err.stack);
      context.print.error('There was an error pushing the XR resource');
    });
  },
};
