const constants = require('../../src/constants');
const codeGen = require('../../src');

const featureName = 'codegen';

module.exports = {
  name: featureName,
  run: async (context) => {
    if (context.parameters.options.help) {
      const header = `amplify ${featureName} [subcommand] \nDescriptions:
      Generates GraphQL statements(queries, mutations and subscriptions) and type annotations. \nSub Commands:`;

      const commands = [
        {
          name: 'types',
          description: constants.CMD_DESCRIPTION_GENERATE_TYPES,
        },
        {
          name: 'statments',
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
      process.exit(1);
    }
    
    try {
      const forceDownloadSchema = !context.parameters.options.nodownload;
      await codeGen.generate(context, forceDownloadSchema);
    } catch (e) {
      context.print.info(e.message);
      process.exit(1);
    }
  },
};
