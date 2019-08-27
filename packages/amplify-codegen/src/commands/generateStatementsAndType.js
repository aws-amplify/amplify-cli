const { join } = require('path');
const {
  AmplifyCodeGenNoAppSyncAPIAvailableError: NoAppSyncAPIAvailableError,
} = require('../errors');
const generateTypes = require('./types');
const generateStatements = require('./statements');
const loadConfig = require('../codegen-config');
const constants = require('../constants');
const { ensureIntrospectionSchema, getAppSyncAPIDetails } = require('../utils');

async function generateStatementsAndTypes(context, forceDownloadSchema, maxDepth) {
  const config = loadConfig(context);
  const projects = config.getProjects();

  const { projectPath } = context.amplify.getEnvInfo();
  const apis = getAppSyncAPIDetails(context);
  if (!projects.length || !apis.length) {
    throw new NoAppSyncAPIAvailableError(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
  }

  const downloadPromises = projects.map(async cfg =>
    await ensureIntrospectionSchema(
      context,
      join(projectPath, cfg.schema),
      apis[0],
      cfg.amplifyExtension.region,
      forceDownloadSchema,
    ),
  );
  await Promise.all(downloadPromises);

  await generateStatements(context, false, maxDepth);
  await generateTypes(context, false);
}

module.exports = generateStatementsAndTypes;
