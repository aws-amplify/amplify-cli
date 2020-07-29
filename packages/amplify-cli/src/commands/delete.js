module.exports = {
  name: 'delete',
  run: async context => {
    if (Array.isArray(context.parameters.array) && context.parameters.array.length > 0) {
      context.print.error('"delete" command does not expect additional arguments.');
      context.print.error('Perhaps you meant to use the "remove" command instead of "delete"?');
      process.exit(1);
    }

    await context.amplify.deleteProject(context);
  },
};
