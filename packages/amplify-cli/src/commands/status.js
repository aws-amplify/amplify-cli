module.exports = {
  name: 'status',
  run: async (context) => {
    context.amplify.showResourceTable();
  },
};
