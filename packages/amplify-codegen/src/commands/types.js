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

    const { projectPath } = context.amplify.getEnvInfo();

    projects.forEach(async (cfg) => {
      const excludes = cfg.excludes.map(pattern => `!${pattern}`);
      const includeFiles = cfg.includes;
      const queries = glob.sync([...includeFiles, ...excludes], {
        cwd: projectPath,
        absolute: true,
      });
      const schemaPath = path.join(projectPath, cfg.schema);
      const { generatedFileName } = cfg.amplifyExtension;
      const target = cfg.amplifyExtension.codeGenTarget;

      if (!generatedFileName || generatedFileName === '') {
        return;
      }
      const outputPath = path.join(projectPath, generatedFileName);
      if (forceDownloadSchema || jetpack.exists(schemaPath) !== 'file') {
        await downloadIntrospectionSchemaWithProgress(
          context,
          cfg.amplifyExtension.graphQLApiId,
          schemaPath,
          cfg.amplifyExtension.region,
        );
      }
      const codeGenSpinner = new Ora(constants.INFO_MESSAGE_CODEGEN_GENERATE_STARTED);
      codeGenSpinner.start();
      generate(queries, schemaPath, path.join(projectPath, generatedFileName), '', target, '', {
        addTypename: true,
      });
      codeGenSpinner.succeed(`${constants.INFO_MESSAGE_CODEGEN_GENERATE_SUCCESS} ${path.relative(path.resolve('.'), outputPath)}`);
    });
  }
}

module.exports = generateTypes;
