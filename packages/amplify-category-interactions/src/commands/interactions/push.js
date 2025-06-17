const subcommand = 'push';
const category = 'interactions';

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;
    context.amplify.constructExeInfo(context);
    context.print
      .warning(`Amazon Lex V1 is reaching end of life on September 15, 2025 and no longer allows creation of new bots as of March 31, 2025. 
      It is recommended that you migrate your bot to Amazon Lex V2 before September 15. \n`);
    return amplify.pushResources(context, category, resourceName).catch((err) => {
      context.print.info(err.stack);
      context.print.error('There was an error pushing the interactions resource');
      context.usageData.emitError(err);
      process.exitCode = 1;
    });
  },
};
