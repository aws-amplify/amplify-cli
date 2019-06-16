const glob = require('glob-all');
const path = require('path');
const { generate } = require('amplify-graphql-types-generator');
const Ora = require('ora');
const jetpack = require('fs-jetpack');

const constants = require('../constants');
const loadConfig = require('../codegen-config');
const { downloadIntrospectionSchemaWithProgress, getFrontEndHandler, getAppSyncAPIDetails } = require('../utils');

async function generateTypes(context, forceDownloadSchema) {
  const frontend = getFrontEndHandler(context);
  if (frontend !== 'android') {
    const config = loadConfig(context);
    const projects = config.getProjects();
    const apis = getAppSyncAPIDetails(context);
    if (!projects.length || !apis.length) {
      context.print.info(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
      return;
    }

    const { projectPath } = context.amplify.getEnvInfo();

    projects.forEach(async (cfg) => {
      const { generatedFileName } = cfg.amplifyExtension || {};
      const includeFiles = cfg.includes;
      if (!generatedFileName || (generatedFileName === '') || (includeFiles.length === 0)) {
        return;
      }

      const excludes = cfg.excludes.map(pattern => `!${pattern}`);
      const queries = glob.sync([...includeFiles, ...excludes], {
        cwd: projectPath,
        absolute: true,
      });
      const schemaPath = path.join(projectPath, cfg.schema);
      const target = cfg.amplifyExtension.codeGenTarget;

      const outputPath = path.join(projectPath, generatedFileName);
      if (forceDownloadSchema || jetpack.exists(schemaPath) !== 'file') {
        await downloadIntrospectionSchemaWithProgress(
          context,
          apis[0].id,
          schemaPath,
          cfg.amplifyExtension.region,
        );
      }
      const codeGenSpinner = new Ora(constants.INFO_MESSAGE_CODEGEN_GENERATE_STARTED);
      codeGenSpinner.start();
      generate(queries, schemaPath, path.join(projectPath, generatedFileName), '', target, '', {
        addTypename: true,
        complexObjectSupport: 'auto',
      });
      codeGenSpinner.succeed(`${constants.INFO_MESSAGE_CODEGEN_GENERATE_SUCCESS} ${path.relative(path.resolve('.'), outputPath)}`);
    });
  }
}

module.exports = generateTypes;
