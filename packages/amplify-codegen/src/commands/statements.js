const path = require('path');
const jetpack = require('fs-jetpack');
const Ora = require('ora');
const statementsGen = require('amplify-graphql-docs-generator').default;

const loadConfig = require('../codegen-config');
const constants = require('../constants');
const { downloadIntrospectionSchemaWithProgress, getFrontEndHandler } = require('../utils');

async function generateStatements(context, forceDownloadSchema, maxDepth) {
  const config = loadConfig(context);
  const projects = config.getProjects();
  const { projectPath } = context.amplify.getEnvInfo();
  if (!projects.length) {
    context.print.info(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
    return;
  }
  projects.forEach(async (cfg) => {
    const includeFiles = path.join(projectPath, cfg.includes[0]);
    const opsGenDirectory = cfg.amplifyExtension.docsFilePath
      ? path.join(projectPath, cfg.amplifyExtension.docsFilePath)
      : path.dirname(path.dirname(includeFiles));
    const schema = path.join(projectPath, cfg.schema);
    if (forceDownloadSchema || jetpack.exists(schema) !== 'file') {
      await downloadIntrospectionSchemaWithProgress(
        context,
        cfg.amplifyExtension.graphQLApiId,
        schema,
        cfg.amplifyExtension.region,
      );
    }
    const frontend = getFrontEndHandler(context);
    const language = frontend === 'javascript' ? cfg.amplifyExtension.codeGenTarget : 'graphql';
    const opsGenSpinner = new Ora(constants.INFO_MESSAGE_OPS_GEN);
    opsGenSpinner.start();
    jetpack.dir(opsGenDirectory);
    await statementsGen(schema, opsGenDirectory, {
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
