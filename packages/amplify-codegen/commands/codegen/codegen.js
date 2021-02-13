const constants = require('../../src/constants');
const codeGen = require('../../src');
const { InvalidSubCommandError, exitOnNextTick } = require('amplify-cli-core');
const featureName = 'codegen';

module.exports = {
  name: featureName,
  run: async context => {
    if (context.parameters.options.help) {
      const header = `amplify ${featureName} [subcommand] [[--nodownload] [--max-depth <number>]]\nDescriptions:
      Generates GraphQL statements (queries, mutations and subscriptions) and type annotations. \nSub Commands:`;

      const commands = [
        {
          name: 'types [--nodownload]',
          description: constants.CMD_DESCRIPTION_GENERATE_TYPES,
        },
        {
          name: 'statements [--nodownload] [--max-depth]',
          description: constants.CMD_DESCRIPTION_GENERATE_STATEMENTS,
        },
        {
          name: 'add',
          description: constants.CMD_DESCRIPTION_ADD,
        },
        {
          name: 'configure',
          description: constants.CMD_DESCRIPTION_CONFIGURE,
        },
      ];
      context.amplify.showHelp(header, commands);
      return;
    }
    if (context.parameters.first) {
      context.print.info(constants.CMD_DESCRIPTION_NOT_SUPPORTED);
      await context.usageData.emitError(new InvalidSubCommandError(constants.CMD_DESCRIPTION_NOT_SUPPORTED));
      exitOnNextTick(1);
    }

    try {
      let forceDownloadSchema = !context.parameters.options.nodownload;
      let { maxDepth } = context.parameters.options;
      await codeGen.generate(context, forceDownloadSchema, maxDepth);
    } catch (e) {
      context.print.info(e.message);
      await context.usageData.emitError(e);
      exitOnNextTick(1);
    }
  },
};
