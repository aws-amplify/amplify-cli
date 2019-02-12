module.exports = {
  name: 'push',
  run: async (context) => {
    context.amplify.constructExeInfo(context);
    try {
      await context.amplify.pushResources(context);
    } catch (e) {
      process.exit(1);
    }
  },
};
