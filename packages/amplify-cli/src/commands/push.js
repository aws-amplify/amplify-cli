module.exports = {
  name: 'push',
  run: async (context) => {
    context.amplify.constructExeInfo(context);
    await context.amplify.pushResources(context);
  },
};
