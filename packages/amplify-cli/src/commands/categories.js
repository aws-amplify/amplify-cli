module.exports = {
  name: 'categories',
  run: async context => {
    await context.amplify.listCategories(context);
  },
};
