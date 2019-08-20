const constants = require('../../src/constants');
const codeGen = require('../../src');
const loadConfig = require('../../src/codegen-config');
const { getAppSyncAPIInfo } = require('../../src/utils');
const featureName = 'codegen';

module.exports = {
  name: featureName,
  run: async (context) => {
    // Determine if working in an amplify project
    try {
      context.amplify.getProjectMeta();
    } catch(e) {
      context.withoutInit = true;
    }

    if (context.parameters.options.help) {
      const header = `amplify ${featureName} [subcommand] [[--nodownload] [--max-depth <number>]]\nDescriptions:
      Generates GraphQL statements(queries, mutations and subscriptions) and type annotations. \nSub Commands:`;

      const commands = [
        {
          name: 'types [--nodownload]',
          description: constants.CMD_DESCRIPTION_GENERATE_TYPES,
        },
        {
          name: 'statments [--nodownload] [--max-depth]',
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
      const config = loadConfig(context);
      const projects = config.getProjects();
      if (!projects.length) {
        throw Error(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
      }
      const project = projects[0];
      const { apiId } = project.amplifyExtension;
      const { region } = project.amplifyExtension;
      let { maxDepth } = context.parameters.options;
      if (!maxDepth) {
        ({ maxDepth } = project.amplifyExtension);
      }
      context.apiDetails = await getAppSyncAPIInfo(context, apiId, region);
      await codeGen.generate(context, forceDownloadSchema, maxDepth);
    } catch (e) {
      context.print.info(e.message);
      process.exit(1);
    }
  },
};
