module.exports = {
  name: 'delete',
  run: async context => {
    await context.amplify.deleteProject(context);
  },
};
