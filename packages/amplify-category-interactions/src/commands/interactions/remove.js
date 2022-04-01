const subcommand = 'remove';
const category = 'interactions';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify.removeResource(context, category, resourceName).catch(err => {
      context.print.info(err.stack);
      context.print.error('There was an error removing the interactions resource');
      context.usageData.emitError(err);
      process.exitCode = 1;
    });
  },
};
