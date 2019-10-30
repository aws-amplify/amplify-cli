const path = require('path');
const fs = require('fs-extra');
const Ora = require('ora');
const { generate } = require('amplify-graphql-docs-generator');

const loadConfig = require('../codegen-config');
const constants = require('../constants');
const { ensureIntrospectionSchema, getFrontEndHandler, getAppSyncAPIDetails } = require('../utils');

async function generateStatements(context, forceDownloadSchema, maxDepth, withoutInit = false, decoupleFrontend = '') {
  try {
    context.amplify.getProjectMeta();
  } catch (e) {
    withoutInit = true;
  }
  const config = loadConfig(context, withoutInit);
  const projects = config.getProjects();
  let apis = [];
  if (!withoutInit) {
    apis = getAppSyncAPIDetails(context);
  }
  let projectPath = process.cwd();
  if (!withoutInit) {
    ({ projectPath } = context.amplify.getEnvInfo());
  }
  if (!projects.length || !apis.length) {
    if (!withoutInit) {
      context.print.info(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
      return;
    }
  }
  if (!projects.length && withoutInit) {
    context.print.info(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
    return;
  }
  await projects.forEach(async cfg => {
    const includeFiles = path.join(projectPath, cfg.includes[0]);
    const opsGenDirectory = cfg.amplifyExtension.docsFilePath
      ? path.join(projectPath, cfg.amplifyExtension.docsFilePath)
      : path.dirname(path.dirname(includeFiles));
    const schemaPath = path.join(projectPath, cfg.schema);
    let region;
    let frontend;
    if (!withoutInit) {
      ({ region } = cfg.amplifyExtension);
      await ensureIntrospectionSchema(context, schemaPath, apis[0], region, forceDownloadSchema);
      frontend = getFrontEndHandler(context);
    } else {
      frontend = decoupleFrontend;
    }
    const language = frontend === 'javascript' ? cfg.amplifyExtension.codeGenTarget : 'graphql';
    const opsGenSpinner = new Ora(constants.INFO_MESSAGE_OPS_GEN);
    opsGenSpinner.start();
    fs.ensureDirSync(opsGenDirectory);
    await generate(schemaPath, opsGenDirectory, {
      separateFiles: true,
      language,
      maxDepth: maxDepth || cfg.amplifyExtension.maxDepth,
    });
    opsGenSpinner.succeed(constants.INFO_MESSAGE_OPS_GEN_SUCCESS + path.relative(path.resolve('.'), opsGenDirectory));
  });
}
module.exports = generateStatements;
