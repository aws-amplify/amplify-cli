const { join } = require('path');
const { AmplifyCodeGenNoAppSyncAPIAvailableError: NoAppSyncAPIAvailableError } = require('../errors');
const generateTypes = require('./types');
const generateStatements = require('./statements');
const loadConfig = require('../codegen-config');
const constants = require('../constants');
const { ensureIntrospectionSchema, getAppSyncAPIDetails } = require('../utils');
const path = require('path');
const fs = require('fs-extra');

async function generateStatementsAndTypes(context, forceDownloadSchema, maxDepth) {
  let withoutInit = false;
  // Determine if working in an amplify project
  try {
    context.amplify.getProjectMeta();
  } catch (e) {
    withoutInit = true;
  }

  // Check if introspection schema exists
  const schemaPath = ['schema.graphql', 'schema.json'].map(p => path.join(process.cwd(), p)).find(p => fs.existsSync(p));
  if (withoutInit && !schemaPath) {
    throw Error(
      `Please download the schema.graphql or schema.json and place in ${process.cwd()} before adding codegen when not in an amplify project`
    );
  }

  if (withoutInit) {
    forceDownloadSchema = false;
  }
  const config = loadConfig(context, withoutInit);
  const projects = config.getProjects();
  if (!projects.length) {
    throw new NoAppSyncAPIAvailableError(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
  }
  let apis = [];
  if (!withoutInit) {
    apis = getAppSyncAPIDetails(context);
  }
  if (!apis.length && !withoutInit) {
    throw new NoAppSyncAPIAvailableError(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
  }
  const project = projects[0];
  const { frontend } = project.amplifyExtension;
  let projectPath = process.cwd();
  if (!withoutInit) {
    ({ projectPath } = context.amplify.getEnvInfo());
  }

  let downloadPromises;
  if (!withoutInit) {
    downloadPromises = projects.map(
      async cfg =>
        await ensureIntrospectionSchema(context, join(projectPath, cfg.schema), apis[0], cfg.amplifyExtension.region, forceDownloadSchema)
    );
    await Promise.all(downloadPromises);
  }
  await generateStatements(context, false, maxDepth, withoutInit, frontend);
  await generateTypes(context, false, withoutInit, frontend);
}

module.exports = generateStatementsAndTypes;
