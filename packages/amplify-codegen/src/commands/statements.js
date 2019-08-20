const path = require('path');
const fs = require('fs-extra');
const Ora = require('ora');
const statementsGen = require('amplify-graphql-docs-generator').default;

const loadConfig = require('../codegen-config');
const constants = require('../constants');
const { downloadIntrospectionSchemaWithProgress, getFrontEndHandler, getAppSyncAPIDetails } = require('../utils');

async function generateStatements(context, forceDownloadSchema, maxDepth) {
  const config = loadConfig(context);
  const projects = config.getProjects();
  let apis = [];
  if (!context.withoutInit) {
    apis = getAppSyncAPIDetails(context);
  } else {
    apis = [context.apiDetails];
  }
  let projectPath = process.cwd();
  if (!context.withoutInit) {
    ({ projectPath } = context.amplify.getEnvInfo());
  }
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
    if (forceDownloadSchema || fs.existsSync(schemaPath) !== 'file') {
      await downloadIntrospectionSchemaWithProgress(
        context,
        apis[0].id,
        schemaPath,
        cfg.amplifyExtension.region,
      );
    }
    let { frontend } = context;
    if (!context.withoutInit) {
      frontend = getFrontEndHandler(context);
    }
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
