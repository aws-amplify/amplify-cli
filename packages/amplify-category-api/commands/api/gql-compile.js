const subcommand = 'gql-compile';

module.exports = {
  name: subcommand,
  run: async context => {
    try {
      await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { forceCompile: true });
    } catch (err) {
      context.print.error(err.toString());
    }
  },
};
