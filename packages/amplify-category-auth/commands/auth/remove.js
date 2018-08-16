const subcommand = 'remove';
const category = 'auth';

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    const dependentResources = Object.keys(amplify.getProjectDetails().amplifyMeta).some(e => ['analytics', 'api', 'storage', 'function'].includes(e));

    if (dependentResources) {
      context.print.info('\nYou have configured resources that might depend on this Cognito resource.  Updating this Cognito resource could have unintended side effects.\n');
    }

    return amplify.removeResource(context, category, resourceName)
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error removing the auth resource');
      });
  },
};
