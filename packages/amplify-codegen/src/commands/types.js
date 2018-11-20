const glob = require('glob-all');
const path = require('path');
const { generate } = require('amplify-graphql-types-generator');
const Ora = require('ora');
const jetpack = require('fs-jetpack');

const constants = require('../constants');
const loadConfig = require('../codegen-config');
const { downloadIntrospectionSchemaWithProgress, getFrontEndHandler } = require('../utils');

async function generateTypes(context, forceDownloadSchema) {
  const frontend = getFrontEndHandler(context);
  if (frontend !== 'android') {
    const config = loadConfig(context);
    const projects = config.getProjects();

    if (!projects.length) {
      context.print.info(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
      return;
    }

    projects.forEach(async (cfg) => {
      const excludes = cfg.excludes.map(pattern => `!${pattern}`);
      const includeFiles = cfg.includes;
      const queries = glob.sync([...includeFiles, ...excludes]);
      const schema = path.resolve(cfg.schema);
      const output = cfg.amplifyExtension.generatedFileName;
      const target = cfg.amplifyExtension.codeGenTarget;
      if (forceDownloadSchema || jetpack.exists(schema) !== 'file') {
        await downloadIntrospectionSchemaWithProgress(
          context,
          cfg.amplifyExtension.graphQLApiId,
          cfg.schema,
          cfg.amplifyExtension.region,
        );
      }
      const codeGenSpinner = new Ora(constants.INFO_MESSAGE_CODEGEN_GENERATE_STARTED);
      codeGenSpinner.start();
      generate(queries, schema, output, '', target, '', {
        addTypename: true,
      });
      codeGenSpinner.succeed(`${constants.INFO_MESSAGE_CODEGEN_GENERATE_SUCCESS} ${output}`);
    });
  }
}

module.exports = generateTypes;
