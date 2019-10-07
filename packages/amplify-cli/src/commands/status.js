module.exports = {
  name: 'status',
  alias: ['ls'],
  run: async context => {
    await context.amplify.showResourceTable();
    await context.amplify.showHelpfulProviderLinks(context);
  },
};
