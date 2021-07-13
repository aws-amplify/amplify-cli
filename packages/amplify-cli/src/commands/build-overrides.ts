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
    } catch (error) {
      context.print.error(error.message);

      if (error.stack) {
        context.print.info(error.stack);
      }

      context.usageData.emitError(error);
      process.exitCode = 1;
    }
  },
};
