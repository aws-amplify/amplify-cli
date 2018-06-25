module.exports = {
  name: 'push',
  run: async (context) => {
    context.amplify.pushResources(context);
  },
};
