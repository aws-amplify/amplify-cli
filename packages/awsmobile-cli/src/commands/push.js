module.exports = {
  name: 'push',
  run: async (context) => {
    context.awsmobile.pushResources(context);
  },
};
