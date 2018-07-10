module.exports = {
  name: 'push',
  run: async (context) => {
    await context.amplify.pushResources(context);
  },
};
