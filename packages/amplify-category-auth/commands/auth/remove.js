const subcommand = 'remove';
const category = 'auth';
const { messages } = require('../../provider-utils/awscloudformation/assets/string-maps');

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    const meta = amplify.getProjectDetails().amplifyMeta;
    const dependentResources = Object.keys(meta).some(e => {
      //eslint-disable-line
      return ['analytics', 'api', 'storage', 'function'].includes(e) && Object.keys(meta[e]).length > 0;
    });

    if (dependentResources) {
      context.print.info(messages.dependenciesExists);
    }

    return amplify.removeResource(context, category, resourceName).catch(err => {
      context.print.info(err.stack);
      context.print.error('There was an error removing the auth resource');
    });
  },
};
