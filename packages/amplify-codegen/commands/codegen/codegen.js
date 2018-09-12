const constants = require('../../src/constants');

const featureName = 'codegen';

module.exports = {
  name: featureName,
  run: async (context) => {
    const header = `amplify ${featureName} <subcommand>`;

    const commands = [
      {
        name: 'generate',
        description: constants.CMD_DESCRIPTION_GENERATE,
      },
      {
        name: 'generate-docs',
        description: constants.CMD_DESCRIPTION_GENERATE_DOCS,
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

    context.print.info('');
  },
};
