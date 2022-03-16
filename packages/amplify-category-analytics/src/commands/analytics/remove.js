const subcommand = 'remove';
const category = 'analytics';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify.removeResource(context, category, resourceName).catch(err => {
      context.print.info(err.stack);
      context.print.error('An error occurred when removing the analytics resource');
      context.usageData.emitError(err);
      process.exitCode = 1;
    });
  },
};
