module.exports = {
  name: 'push',
  run: async (context) => {
    try {
      context.amplify.constructExeInfo(context);
      await context.amplify.pushResources(context);
    } catch (e) {
      context.print.error(`An error occured during the push operation: ${e.message}`);
      process.exit(1);
    }
  },
};
