const subcommand = 'push';
const category = 'api';

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;
    context.amplify.constructExeInfo(context);
    return amplify.pushResources(context, category, resourceName)
      .catch((err) => {
        context.print.error('There was an error pushing the API resource');
        context.print.error(err.toString());
      });
  },
};
