const path = require('path');
const fs = require('fs-extra');
const Ora = require('ora');
const statementsGen = require('amplify-graphql-docs-generator').default;

const loadConfig = require('../codegen-config');
const constants = require('../constants');
const { ensureIntrospectionSchema, getFrontEndHandler, getAppSyncAPIDetails } = require('../utils');

async function generateStatements(context, forceDownloadSchema, maxDepth) {
  const config = loadConfig(context);
  const projects = config.getProjects();
  const apis = getAppSyncAPIDetails(context);
  const { projectPath } = context.amplify.getEnvInfo();
  if (!projects.length || !apis.length) {
    context.print.info(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
    return;
  }
  await projects.forEach(async (cfg) => {
    const includeFiles = path.join(projectPath, cfg.includes[0]);
    const opsGenDirectory = cfg.amplifyExtension.docsFilePath
      ? path.join(projectPath, cfg.amplifyExtension.docsFilePath)
      : path.dirname(path.dirname(includeFiles));
    const schemaPath = path.join(projectPath, cfg.schema);
    const { region } = cfg.amplifyExtension;
    await ensureIntrospectionSchema(context, schemaPath, apis[0], region, forceDownloadSchema);
    const frontend = getFrontEndHandler(context);
    const language = frontend === 'javascript' ? cfg.amplifyExtension.codeGenTarget : 'graphql';
    const opsGenSpinner = new Ora(constants.INFO_MESSAGE_OPS_GEN);
    opsGenSpinner.start();
    fs.ensureDirSync(opsGenDirectory);
    await statementsGen(schemaPath, opsGenDirectory, {
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
