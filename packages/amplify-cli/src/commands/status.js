module.exports = {
  name: 'status',
  run: async (context) => {
    await context.amplify.showResourceTable();
  },
};
