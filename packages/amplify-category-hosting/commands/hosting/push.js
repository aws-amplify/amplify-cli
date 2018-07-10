module.exports = {
  name: 'push',
  run: async (context) => {
    const { amplify } = context;

    return amplify.pushResources(context, 'hosting', 'default')
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error pushing the hosting resource');
      });
  },
};
