/**
 * Command to transform CFN with overrides
 */
const subcommand = 'build-overrides';

module.exports = {
  name: subcommand,
  run: async context => {
    try {
      const {
        parameters: { options },
      } = context;
      await context.amplify.executeProviderUtils(context, 'awscloudformation', 'buildOverrides', {
        forceCompile: true,
      });
    } catch (err) {
      context.print.error(err.toString());
      context.usageData.emitError(err);
      process.exitCode = 1;
    }
  },
};
