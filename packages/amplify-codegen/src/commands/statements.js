const path = require('path');
const jetpack = require('fs-jetpack');
const Ora = require('ora');
const statementsGen = require('amplify-graphql-docs-generator').default;

const loadConfig = require('../codegen-config');
const constants = require('../constants');
const { downloadIntrospectionSchemaWithProgress, getFrontEndHandler } = require('../utils');

async function generateStatements(context, forceDownloadSchema) {
  const config = loadConfig(context);
  const projects = config.getProjects();
  if (!projects.length) {
    context.print.info(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
    return;
  }
  projects.forEach(async (cfg) => {
    const includeFiles = cfg.includes[0];
    const opsGenDirectory =
      cfg.amplifyExtension.docsFilePath || path.dirname(path.dirname(includeFiles));
    const schema = path.resolve(cfg.schema);
    if (forceDownloadSchema || jetpack.exists(schema) !== 'file') {
      await downloadIntrospectionSchemaWithProgress(
        context,
        cfg.amplifyExtension.graphQLApiId,
        cfg.schema,
        cfg.amplifyExtension.region,
      );
    }
    const frontend = getFrontEndHandler(context);
    const language = frontend === 'javascript' ? cfg.amplifyExtension.codeGenTarget : 'graphql';
    const opsGenSpinner = new Ora(constants.INFO_MESSAGE_OPS_GEN);
    opsGenSpinner.start();
    jetpack.dir(opsGenDirectory);
    await statementsGen(schema, opsGenDirectory, { separateFiles: true, language });
    opsGenSpinner.succeed(
      constants.INFO_MESSAGE_OPS_GEN_SUCCESS + path.relative(path.resolve('.'), opsGenDirectory),
    );
  });
}
module.exports = generateStatements;
