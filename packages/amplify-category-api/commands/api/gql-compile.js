const subcommand = 'gql-compile';

module.exports = {
  name: subcommand,
  run: async (context) => {
    try {
      await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { noConfig: true });
    } catch (err) {
      context.print.info(err.stack);
      context.print.error(err.message);
    }
  },
};
