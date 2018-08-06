const subcommand = 'gql-compile';

module.exports = {
  name: subcommand,
  run: async (context) => {
    await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { noConfig: true });
  },
};
