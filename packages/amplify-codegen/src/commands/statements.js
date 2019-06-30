const path = require('path');
const jetpack = require('fs-jetpack');
const Ora = require('ora');
const { generateAndSave } = require('amplify-graphql-docs-generator');

const loadConfig = require('../codegen-config');
const constants = require('../constants');
const { downloadIntrospectionSchemaWithProgress, getFrontEndHandler, getAppSyncAPIDetails } = require('../utils');

async function generateStatements(context, forceDownloadSchema, maxDepth) {
  const config = loadConfig(context);
  const projects = config.getProjects();
  const apis = getAppSyncAPIDetails(context);
  const { projectPath } = context.amplify.getEnvInfo();
  if (!projects.length || !apis.length) {
    context.print.info(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
    return;
  }
  projects.forEach(async (cfg) => {
    const includeFiles = path.join(projectPath, cfg.includes[0]);
    const opsGenDirectory = cfg.amplifyExtension.docsFilePath
      ? path.join(projectPath, cfg.amplifyExtension.docsFilePath)
      : path.dirname(path.dirname(includeFiles));
    const schemaPath = path.join(projectPath, cfg.schema);
    if (forceDownloadSchema || jetpack.exists(schemaPath) !== 'file') {
      await downloadIntrospectionSchemaWithProgress(
        context,
        apis[0].id,
        schemaPath,
        cfg.amplifyExtension.region,
      );
    }
    const frontend = getFrontEndHandler(context);
    const language = frontend === 'javascript' ? cfg.amplifyExtension.codeGenTarget : 'graphql';
    const opsGenSpinner = new Ora(constants.INFO_MESSAGE_OPS_GEN);
    opsGenSpinner.start();
    jetpack.dir(opsGenDirectory);
    await generateAndSave(schemaPath, opsGenDirectory, {
      separateFiles: true,
      language,
      maxDepth: maxDepth || cfg.amplifyExtension.maxDepth,
    });
    opsGenSpinner.succeed(
      constants.INFO_MESSAGE_OPS_GEN_SUCCESS + path.relative(path.resolve('.'), opsGenDirectory),
    );
  });
}
module.exports = generateStatements;
